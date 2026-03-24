/**
 * Backfill script: populate per-facility UserClub rows from existing User records.
 *
 * Creates one UserClub row per user per active facility in their club,
 * with the user's current userType as the role at each facility.
 *
 * Run after migration if needed:
 *   npx tsx prisma/scripts/backfill-userclub.ts
 *
 * Idempotent — uses upsert so it's safe to re-run.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
	const users = await db.user.findMany({
		select: {
			userId: true,
			clubShortName: true,
			userType: true,
		},
	});

	console.log(`Found ${users.length} users to backfill.`);

	let created = 0;

	for (const user of users) {
		const facilities = await db.clubFacility.findMany({
			where: { clubShortName: user.clubShortName, isActive: true },
			select: { facilityId: true },
		});

		for (const f of facilities) {
			await db.userClub.upsert({
				where: {
					userId_facilityId: {
						userId: user.userId,
						facilityId: f.facilityId,
					},
				},
				create: {
					userId: user.userId,
					clubShortName: user.clubShortName,
					facilityId: f.facilityId,
					role: user.userType,
				},
				update: {},
			});
			created++;
		}
	}

	console.log(`Done. Upserted ${created} UserClub rows.`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => void db.$disconnect());
