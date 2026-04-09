"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { useToast } from "~/app/_components/shared/Toast";
import { Select } from "~/app/_components/shared/ui/select";
import { api } from "~/trpc/react";

interface SellPackageModalProps {
	userId: string;
	memberName: string;
	onClose: () => void;
}

export default function SellPackageModal({
	userId,
	memberName,
	onClose,
}: SellPackageModalProps) {
	const { toast } = useToast();
	const [selectedPlanId, setSelectedPlanId] = useState<string>("");
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);

	const { data: plansData, isLoading } = api.packages.listPackagePlans.useQuery(
		{ isActive: true },
	);

	const utils = api.useUtils();

	const sellMutation = api.packages.sellPackage.useMutation({
		onSuccess: () => {
			void utils.packages.getMemberPackages.invalidate({ userId });
			toast("Package sold", "success");
			onClose();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
		onSettled: () => setSaving(false),
	});

	const plans = plansData?.plans ?? [];
	const selectedPlan = plans.find((p) => p.packagePlanId === selectedPlanId);

	const formatPrice = (cents: number) =>
		new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(cents / 100);

	const formatValidity = (
		durationValue: number | null,
		durationUnit: string | null,
	) => {
		if (durationValue === null || durationUnit === null) return "No expiry";
		return `${durationValue} ${durationUnit}`;
	};

	const handleSell = () => {
		if (!selectedPlanId) {
			toast("Select a package plan", "error");
			return;
		}
		setSaving(true);
		sellMutation.mutate({
			userId,
			packagePlanId: selectedPlanId,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
				onClick={saving ? undefined : onClose}
			/>

			{/* Modal */}
			<div className="glass-panel fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-[var(--border)] border-l shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-[var(--border)] border-b px-6 py-4">
					<h2 className="font-semibold text-[var(--foreground)] text-base">
						Sell Package to {memberName}
					</h2>
					<button
						onClick={onClose}
						disabled={saving}
						className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50"
						aria-label="Close"
						type="button"
					>
						<X size={18} />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
					{/* Plan picker */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Package Plan <span className="text-red-500">*</span>
						</label>
						{isLoading ? (
							<p className="text-[var(--muted-foreground)] text-xs">Loading...</p>
						) : plans.length === 0 ? (
							<p className="text-[var(--muted-foreground)] text-xs">
								No active package plans. Create one under{" "}
								<a href="/admin/packages" className="underline">
									Packages
								</a>
								.
							</p>
						) : (
							<Select
								value={selectedPlanId}
								onChange={(e) => setSelectedPlanId(e.target.value)}
								className="h-9"
							>
								<option value="">— Select a plan —</option>
								{plans.map((plan) => (
									<option key={plan.packagePlanId} value={plan.packagePlanId}>
										{plan.name} — {formatPrice(plan.priceInCents)}
									</option>
								))}
							</Select>
						)}
					</div>

					{/* Plan summary */}
					{selectedPlan && (
						<div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4 text-sm">
							<div className="grid grid-cols-2 gap-2">
								<div className="text-[var(--muted-foreground)]">Eligibility</div>
								<div className="text-[var(--foreground)]">
									{selectedPlan.isGeneralDropIn
										? "General open play"
										: (selectedPlan.product?.name ?? "—")}
								</div>
								<div className="text-[var(--muted-foreground)]">Credits</div>
								<div className="text-[var(--foreground)]">
									{selectedPlan.sessionCount ?? "Unlimited"}
								</div>
								<div className="text-[var(--muted-foreground)]">Price</div>
								<div className="text-[var(--foreground)]">
									{formatPrice(selectedPlan.priceInCents)}
								</div>
								<div className="text-[var(--muted-foreground)]">Valid for</div>
								<div className="text-[var(--foreground)]">
									{formatValidity(
										selectedPlan.durationValue,
										selectedPlan.durationUnit,
									)}
								</div>
							</div>
						</div>
					)}

					{/* Notes */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Notes
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							placeholder="Optional notes"
							maxLength={2000}
							disabled={saving}
							className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[var(--foreground)] text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-2 border-[var(--border)] border-t px-6 py-4">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={saving}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleSell}
						disabled={!selectedPlanId || saving}
					>
						{saving ? "Selling..." : "Sell Package"}
					</Button>
				</div>
			</div>
		</>
	);
}
