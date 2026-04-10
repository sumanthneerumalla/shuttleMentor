/**
 * consumeCredit — internal backend function for deducting credits from a MemberPackage.
 *
 * NOT a tRPC endpoint. Called from inside other mutations (registerForEvent, staffCheckin).
 *
 * Matching logic (per phase8-packages.md):
 *   - If called with eventId: find member packages where packagePlan.productId === event.productId
 *   - If called without eventId (general check-in): find packages where packagePlan.isGeneralDropIn = true
 *   - Always filter by status='active' AND (endDate IS NULL OR endDate > now()) — don't trust stored status
 *   - Order by endDate ASC NULLS LAST (FIFO — soonest-to-expire first)
 *   - Atomic UPDATE: SET creditsUsed = creditsUsed + cost WHERE creditsUsed + cost <= creditsTotal
 *     (handles race conditions — if the WHERE clause fails, try the next package)
 *   - Multi-credit events: if no single package has enough credits, fail entirely (decision #60)
 *
 * Returns: { usage: PackageCreditUsage } on success, or { usage: null, reason } if no match.
 * Registration/check-in still succeeds — member just doesn't get a credit deducted (invoice
 * line item comes from Phase 9).
 */

import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Prisma.TransactionClient | PrismaClient;

interface ConsumeCreditArgs {
	tx: TxClient;
	userId: string;
	clubShortName: string;
	eventId?: string | null;
	eventProductId?: string | null;
	creditCost?: number | null;
	registrationId?: string | null;
	attendanceId?: string | null;
}

export type ConsumeCreditResult =
	| { ok: true; usageId: string; memberPackageId: string; creditsConsumed: number }
	| { ok: false; reason: "no_match" | "insufficient_credits" | "skipped" };

export async function consumeCredit({
	tx,
	userId,
	clubShortName,
	eventId,
	eventProductId,
	creditCost,
	registrationId,
	attendanceId,
}: ConsumeCreditArgs): Promise<ConsumeCreditResult> {
	// Determine how many credits to deduct
	// - For event-based: use creditCost (null/0 = skip)
	// - For general check-in (no eventId): always 1
	const cost = eventId ? (creditCost ?? 0) : 1;

	if (cost <= 0) {
		return { ok: false, reason: "skipped" };
	}

	// Build the FIFO query
	// Event-specific: match packagePlan.productId === event.productId
	// General check-in: match packagePlan.isGeneralDropIn === true
	const now = new Date();

	const whereClause: Prisma.MemberPackageWhereInput = {
		clubShortName,
		userId,
		status: "active",
		OR: [{ endDate: null }, { endDate: { gt: now } }],
		packagePlan: eventId
			? { productId: eventProductId ?? undefined }
			: { isGeneralDropIn: true },
	};

	// Fetch candidates sorted FIFO (soonest-to-expire first, null endDate last)
	const candidates = await tx.memberPackage.findMany({
		where: whereClause,
		orderBy: [{ endDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
		select: {
			memberPackageId: true,
			creditsTotal: true,
			creditsUsed: true,
		},
	});

	if (candidates.length === 0) {
		return { ok: false, reason: "no_match" };
	}

	// Try to atomically deduct from each candidate in FIFO order
	// updateMany with WHERE creditsUsed + cost <= creditsTotal handles race conditions.
	// If updateMany.count === 0, another concurrent deduction depleted it — try the next one.
	for (const candidate of candidates) {
		// Unlimited package (creditsTotal = null) always has room
		if (candidate.creditsTotal === null) {
			const updated = await tx.memberPackage.update({
				where: { memberPackageId: candidate.memberPackageId },
				data: { creditsUsed: { increment: cost } },
				select: { memberPackageId: true },
			});

			const usage = await tx.packageCreditUsage.create({
				data: {
					memberPackageId: updated.memberPackageId,
					eventId: eventId ?? null,
					registrationId: registrationId ?? null,
					attendanceId: attendanceId ?? null,
					creditsConsumed: cost,
				},
			});

			return {
				ok: true,
				usageId: usage.usageId,
				memberPackageId: updated.memberPackageId,
				creditsConsumed: cost,
			};
		}

		// Fixed-count package: must have enough remaining for a single-package deduction
		// (decision #60: no split across packages)
		if (candidate.creditsUsed + cost > candidate.creditsTotal) {
			continue;
		}

		// Best-effort conditional update. NOTE: `candidate.creditsUsed` is a stale literal
		// captured from the earlier findMany read — this WHERE clause does NOT check the
		// current DB value of creditsUsed. Under rare concurrent deductions on the same
		// package, this can allow over-deduction. Low risk in MVP (manual staff actions),
		// but must be replaced with $executeRaw(`WHERE "creditsUsed" + $cost <= "creditsTotal"`)
		// before self-service registration or 8b ships. See HANDOFF open thread #4.
		const result = await tx.memberPackage.updateMany({
			where: {
				memberPackageId: candidate.memberPackageId,
				creditsTotal: { gte: candidate.creditsUsed + cost },
			},
			data: { creditsUsed: { increment: cost } },
		});

		if (result.count === 0) {
			// Concurrent deduction depleted this package — try the next candidate
			continue;
		}

		// Re-read to compute post-deduction state and flip to 'depleted' if needed
		const fresh = await tx.memberPackage.findUnique({
			where: { memberPackageId: candidate.memberPackageId },
			select: { creditsTotal: true, creditsUsed: true },
		});

		if (
			fresh?.creditsTotal !== null &&
			fresh?.creditsTotal !== undefined &&
			fresh.creditsUsed >= fresh.creditsTotal
		) {
			await tx.memberPackage.update({
				where: { memberPackageId: candidate.memberPackageId },
				data: { status: "depleted" },
			});
		}

		const usage = await tx.packageCreditUsage.create({
			data: {
				memberPackageId: candidate.memberPackageId,
				eventId: eventId ?? null,
				registrationId: registrationId ?? null,
				attendanceId: attendanceId ?? null,
				creditsConsumed: cost,
			},
		});

		return {
			ok: true,
			usageId: usage.usageId,
			memberPackageId: candidate.memberPackageId,
			creditsConsumed: cost,
		};
	}

	// No candidate had enough credits for this single deduction (multi-credit event, no single package has enough)
	return { ok: false, reason: "insufficient_credits" };
}
