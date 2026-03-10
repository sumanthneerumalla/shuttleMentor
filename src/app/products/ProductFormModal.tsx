"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/app/_components/shared/Button";
import { Input } from "~/app/_components/shared/Input";
import { useToast } from "~/app/_components/shared/Toast";
import { api } from "~/trpc/react";

type Product = {
	productId: string;
	category: string;
	name: string;
	description: string | null;
	priceInCents: number;
	currency: string;
};

interface ProductFormModalProps {
	product?: Product | null;
	onClose: () => void;
}

export default function ProductFormModal({
	product,
	onClose,
}: ProductFormModalProps) {
	const isEdit = product != null;
	const { toast } = useToast();

	const [category, setCategory] = useState<string>(
		product?.category ?? "CALENDAR_EVENT",
	);
	const [name, setName] = useState(product?.name ?? "");
	const [description, setDescription] = useState(product?.description ?? "");
	const [priceInCents, setPriceInCents] = useState(product?.priceInCents ?? 0);
	const [saving, setSaving] = useState(false);

	const utils = api.useUtils();

	const createMutation = api.products.createProduct.useMutation({
		onSuccess: () => {
			void utils.products.getProducts.invalidate();
			toast("Product created successfully", "success");
			onClose();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
		onSettled: () => {
			setSaving(false);
		},
	});

	const updateMutation = api.products.updateProduct.useMutation({
		onSuccess: () => {
			void utils.products.getProducts.invalidate();
			toast("Product updated successfully", "success");
			onClose();
		},
		onError: (err) => {
			toast(err.message, "error");
		},
		onSettled: () => {
			setSaving(false);
		},
	});

	const handleSave = () => {
		if (!name.trim()) {
			toast("Product name is required", "error");
			return;
		}

		setSaving(true);

		if (isEdit && product) {
			updateMutation.mutate({
				productId: product.productId,
				name: name.trim(),
				description: description.trim() || null,
				priceInCents,
			});
		} else {
			createMutation.mutate({
				category: category as
					| "COACHING_SESSION"
					| "CALENDAR_EVENT"
					| "COACHING_SLOT"
					| "CREDIT_PACK",
				name: name.trim(),
				description: description.trim() || undefined,
				priceInCents,
				currency: "usd",
			});
		}
	};

	const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		// Allow empty string or valid decimal numbers
		if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
			const dollars = Number.parseFloat(value || "0");
			setPriceInCents(Math.round(dollars * 100));
		}
	};

	const priceInDollars = (priceInCents / 100).toFixed(2);

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
						{isEdit ? "Edit Product" : "New Product"}
					</h2>
					<button
						onClick={onClose}
						disabled={saving}
						className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
					{/* Category (only for new products) */}
					{!isEdit && (
						<div className="space-y-1">
							<label className="font-medium text-[var(--foreground)] text-sm">
								Category <span className="text-red-500">*</span>
							</label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[var(--foreground)] text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							>
								<option value="CALENDAR_EVENT">Calendar Event</option>
								<option value="COACHING_SESSION">Coaching Session</option>
								<option value="COACHING_SLOT">Coaching Slot</option>
								<option value="CREDIT_PACK">Credit Pack</option>
							</select>
							<p className="text-[var(--muted-foreground)] text-xs">
								{category === "CALENDAR_EVENT" &&
									"For bookable events like drop-ins, leagues, open gym"}
								{category === "COACHING_SESSION" &&
									"For async coaching services (video review, etc.)"}
								{category === "COACHING_SLOT" &&
									"For coach-created training slots on the calendar"}
								{category === "CREDIT_PACK" &&
									"For purchasable credit packs (Phase 5)"}
							</p>
						</div>
					)}

					{/* Name */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Product Name <span className="text-red-500">*</span>
						</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Drop-in Badminton, 1-on-1 Coaching Session"
							maxLength={200}
							disabled={saving}
						/>
					</div>

					{/* Description */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Optional description of what's included"
							maxLength={2000}
							disabled={saving}
							className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[var(--foreground)] text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
						/>
					</div>

					{/* Price */}
					<div className="space-y-1">
						<label className="font-medium text-[var(--foreground)] text-sm">
							Price (USD) <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<span className="-translate-y-1/2 absolute top-1/2 left-3 text-[var(--muted-foreground)] text-sm">
								$
							</span>
							<Input
								type="text"
								value={priceInDollars}
								onChange={handlePriceChange}
								placeholder="0.00"
								disabled={saving}
								className="pl-7"
							/>
						</div>
						<p className="text-[var(--muted-foreground)] text-xs">
							Enter 0 for free events. Price is stored in cents ({priceInCents}
							¢).
						</p>
					</div>

					{isEdit && (
						<div className="rounded-lg bg-[var(--muted)] p-3 text-[var(--muted-foreground)] text-xs">
							<strong>Note:</strong> Category cannot be changed after creation.
							Polar sync fields (Product ID, Price ID) are managed automatically
							in Phase 3.
						</div>
					)}
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
						onClick={handleSave}
						disabled={!name.trim() || saving}
					>
						{saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
					</Button>
				</div>
			</div>
		</>
	);
}
