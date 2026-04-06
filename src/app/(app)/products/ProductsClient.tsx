"use client";

import { Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";
import ProductFormModal from "~/app/(app)/products/ProductFormModal";
import { Button } from "~/app/_components/shared/Button";
import { ToastContainer, useToast } from "~/app/_components/shared/Toast";
import { isFacilityOrAbove } from "~/lib/utils";
import { api } from "~/trpc/react";

type Product = {
	productId: string;
	category: string;
	name: string;
	description: string | null;
	priceInCents: number;
	currency: string;
	polarProductId: string | null;
	polarPriceId: string | null;
	isActive: boolean;
	createdByUser: {
		firstName: string | null;
		lastName: string | null;
	};
	_count: {
		calendarEvents: number;
		registrations: number;
	};
	createdAt: Date;
};

export default function ProductsClient() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [showInactive, setShowInactive] = useState(false);
	const { toasts, toast, dismiss } = useToast();

	const { data: user, isLoading: isUserLoading } = api.user.getOrCreateProfile.useQuery();
	const { data: productsData, isLoading } = api.products.getProducts.useQuery({
		includeInactive: showInactive,
	});

	const utils = api.useUtils();

	const deleteProductMutation = api.products.deleteProduct.useMutation({
		onSuccess: () => {
			void utils.products.getProducts.invalidate();
			toast("Product deleted successfully", "success");
		},
		onError: (err) => {
			toast(err.message, "error");
		},
	});

	const toggleActiveMutation = api.products.updateProduct.useMutation({
		onSuccess: (_, vars) => {
			void utils.products.getProducts.invalidate();
			toast(
				vars.isActive ? "Product activated" : "Product deactivated",
				"success",
			);
		},
		onError: (err) => {
			toast(err.message, "error");
		},
	});

	const handleToggleActive = (product: Product) => {
		toggleActiveMutation.mutate({
			productId: product.productId,
			isActive: !product.isActive,
		});
	};

	const isFacilityOrAdmin = user ? isFacilityOrAbove(user) : false;

	if (isUserLoading) {
		return (
			<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
				<p className="text-[var(--muted-foreground)] text-sm">Loading...</p>
			</div>
		);
	}

	if (!isFacilityOrAdmin) {
		return (
			<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
				<div className="text-center">
					<h2 className="font-semibold text-[var(--foreground)] text-xl">
						Access Denied
					</h2>
					<p className="mt-2 text-[var(--muted-foreground)] text-sm">
						Only facility managers and admins can manage products.
					</p>
				</div>
			</div>
		);
	}

	const handleEdit = (product: Product) => {
		setEditingProduct(product);
		setIsFormOpen(true);
	};

	const handleDelete = (product: Product) => {
		if (product._count.calendarEvents > 0) {
			toast(
				`Cannot delete product linked to ${product._count.calendarEvents} event(s)`,
				"error",
			);
			return;
		}
		if (product._count.registrations > 0) {
			toast(
				`Cannot delete product with ${product._count.registrations} registration(s)`,
				"error",
			);
			return;
		}
		if (window.confirm(`Delete "${product.name}"?`)) {
			deleteProductMutation.mutate({ productId: product.productId });
		}
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingProduct(null);
	};

	const formatPrice = (cents: number, currency: string) => {
		const dollars = cents / 100;
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
		}).format(dollars);
	};

	const getCategoryLabel = (category: string) => {
		const labels: Record<string, string> = {
			COACHING_SESSION: "Coaching Session",
			CALENDAR_EVENT: "Calendar Event",
			COACHING_SLOT: "Coaching Slot",
			CREDIT_PACK: "Credit Pack",
		};
		return labels[category] ?? category;
	};

	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
				<div className="animate-pulse space-y-4">
					<div className="h-8 w-48 rounded bg-gray-200" />
					<div className="h-96 w-full rounded bg-gray-200" />
				</div>
			</div>
		);
	}

	const products = productsData?.products ?? [];

	return (
		<div className="h-[calc(100vh-5rem)] overflow-auto p-4 md:p-6">
			<ToastContainer toasts={toasts} onDismiss={dismiss} />

			{/* Header */}
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl text-[var(--foreground)]">
						Products
					</h1>
					<p className="mt-1 text-[var(--muted-foreground)] text-sm">
						Manage products for bookable events, coaching sessions, and credit
						packs
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<label className="flex cursor-pointer select-none items-center gap-2 text-[var(--muted-foreground)] text-sm">
						<input
							type="checkbox"
							checked={showInactive}
							onChange={(e) => setShowInactive(e.target.checked)}
							className="h-4 w-4 rounded border-input accent-[var(--primary)]"
						/>
						Show inactive
					</label>
					<Button onClick={() => setIsFormOpen(true)}>
						<Plus size={16} />
						New Product
					</Button>
				</div>
			</div>

			{/* Products List */}
			{products.length === 0 ? (
				<div className="flex h-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
					<div className="text-center">
						<p className="text-[var(--muted-foreground)] text-sm">
							No products yet
						</p>
						<Button className="mt-4" onClick={() => setIsFormOpen(true)}>
							<Plus size={16} />
							Create Your First Product
						</Button>
					</div>
				</div>
			) : (
				<>
					{/* Mobile cards */}
					<div className="space-y-3 md:hidden">
						{products.map((product) => (
							<div
								key={product.productId}
								className={`rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 ${!product.isActive ? "opacity-50" : ""}`}
							>
								<div className="mb-2 flex items-start justify-between gap-2">
									<div className="min-w-0">
										<p className="font-medium text-[var(--foreground)]">
											{product.name}
										</p>
										{product.description && (
											<p className="mt-0.5 line-clamp-1 text-[var(--muted-foreground)] text-xs">
												{product.description}
											</p>
										)}
									</div>
									<div className="flex shrink-0 gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleToggleActive(product)}
											disabled={toggleActiveMutation.isPending}
											aria-label={
												product.isActive
													? "Deactivate product"
													: "Activate product"
											}
											title={product.isActive ? "Deactivate" : "Activate"}
										>
											{product.isActive ? (
												<ToggleRight size={16} className="text-green-600" />
											) : (
												<ToggleLeft size={16} />
											)}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleEdit(product)}
											aria-label="Edit product"
										>
											<Pencil size={16} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(product)}
											aria-label="Delete product"
											className="hover:bg-red-50 hover:text-red-600"
										>
											<Trash2 size={16} />
										</Button>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2 text-xs">
									<span className="inline-flex rounded-full bg-[var(--accent)] px-2 py-1 font-medium text-[var(--foreground)]">
										{getCategoryLabel(product.category)}
									</span>
									<span className="text-[var(--foreground)]">
										{formatPrice(product.priceInCents, product.currency)}
									</span>
									<span className="text-[var(--muted-foreground)]">
										{product._count.calendarEvents} events ·{" "}
										{product._count.registrations} registrations
									</span>
									{product.isActive ? (
										<span className="inline-flex items-center gap-1 text-green-600">
											<span className="h-2 w-2 rounded-full bg-green-600" />
											Active
										</span>
									) : (
										<span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
											<span className="h-2 w-2 rounded-full bg-gray-400" />
											Inactive
										</span>
									)}
								</div>
							</div>
						))}
					</div>

					{/* Desktop table */}
					<div className="hidden overflow-hidden rounded-lg border border-[var(--border)] md:block">
						<table className="w-full">
							<thead className="bg-[var(--muted)] text-left text-sm">
								<tr>
									<th className="px-4 py-3 font-medium">Name</th>
									<th className="px-4 py-3 font-medium">Category</th>
									<th className="px-4 py-3 font-medium">Price</th>
									<th className="px-4 py-3 font-medium">Usage</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
								{products.map((product) => (
									<tr
										key={product.productId}
										className={`hover:bg-[var(--accent)] ${!product.isActive ? "opacity-50" : ""}`}
									>
										<td className="px-4 py-3">
											<div>
												<div className="font-medium text-[var(--foreground)]">
													{product.name}
												</div>
												{product.description && (
													<div className="mt-0.5 line-clamp-1 text-[var(--muted-foreground)] text-xs">
														{product.description}
													</div>
												)}
											</div>
										</td>
										<td className="px-4 py-3">
											<span className="inline-flex rounded-full bg-[var(--accent)] px-2 py-1 font-medium text-[var(--foreground)] text-xs">
												{getCategoryLabel(product.category)}
											</span>
										</td>
										<td className="px-4 py-3 text-[var(--foreground)] text-sm">
											{formatPrice(product.priceInCents, product.currency)}
										</td>
										<td className="px-4 py-3 text-[var(--muted-foreground)] text-sm">
											{product._count.calendarEvents} events,{" "}
											{product._count.registrations} registrations
										</td>
										<td className="px-4 py-3">
											{product.isActive ? (
												<span className="inline-flex items-center gap-1 text-green-600 text-xs">
													<span className="h-2 w-2 rounded-full bg-green-600" />
													Active
												</span>
											) : (
												<span className="inline-flex items-center gap-1 text-[var(--muted-foreground)] text-xs">
													<span className="h-2 w-2 rounded-full bg-gray-400" />
													Inactive
												</span>
											)}
										</td>
										<td className="px-4 py-3">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleToggleActive(product)}
													disabled={toggleActiveMutation.isPending}
													aria-label={
														product.isActive
															? "Deactivate product"
															: "Activate product"
													}
													title={product.isActive ? "Deactivate" : "Activate"}
												>
													{product.isActive ? (
														<ToggleRight size={16} className="text-green-600" />
													) : (
														<ToggleLeft size={16} />
													)}
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleEdit(product)}
													aria-label="Edit product"
												>
													<Pencil size={16} />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDelete(product)}
													aria-label="Delete product"
													className="hover:bg-red-50 hover:text-red-600"
												>
													<Trash2 size={16} />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}

			{/* Product Form Modal */}
			{isFormOpen && (
				<ProductFormModal product={editingProduct} onClose={handleCloseForm} />
			)}
		</div>
	);
}
