"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/shared/Button";
import { useToast, ToastContainer } from "~/app/_components/shared/Toast";
import ProductFormModal from "~/app/products/ProductFormModal";

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

	const { data: user } = api.user.getOrCreateProfile.useQuery();
	const { data: productsData, isLoading } = api.products.getProducts.useQuery({ includeInactive: showInactive });

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
			toast(vars.isActive ? "Product activated" : "Product deactivated", "success");
		},
		onError: (err) => {
			toast(err.message, "error");
		},
	});

	const handleToggleActive = (product: Product) => {
		toggleActiveMutation.mutate({ productId: product.productId, isActive: !product.isActive });
	};

	const isFacilityOrAdmin = user?.userType === "FACILITY" || user?.userType === "ADMIN";

	if (!isFacilityOrAdmin) {
		return (
			<div className="flex h-[calc(100vh-5rem)] items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-[var(--foreground)]">Access Denied</h2>
					<p className="mt-2 text-sm text-[var(--muted-foreground)]">
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
			toast(`Cannot delete product linked to ${product._count.calendarEvents} event(s)`, "error");
			return;
		}
		if (product._count.registrations > 0) {
			toast(`Cannot delete product with ${product._count.registrations} registration(s)`, "error");
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
		<div className="h-[calc(100vh-5rem)] overflow-auto p-6">
			<ToastContainer toasts={toasts} onDismiss={dismiss} />

			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-[var(--foreground)]">Products</h1>
					<p className="mt-1 text-sm text-[var(--muted-foreground)]">
						Manage products for bookable events, coaching sessions, and credit packs
					</p>
				</div>
				<div className="flex items-center gap-3">
					<label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--muted-foreground)] select-none">
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

			{/* Products Table */}
			{products.length === 0 ? (
				<div className="flex h-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
					<div className="text-center">
						<p className="text-sm text-[var(--muted-foreground)]">No products yet</p>
						<Button className="mt-4" onClick={() => setIsFormOpen(true)}>
							<Plus size={16} />
							Create Your First Product
						</Button>
					</div>
				</div>
			) : (
				<div className="overflow-hidden rounded-lg border border-[var(--border)]">
					<table className="w-full">
						<thead className="bg-[var(--muted)] text-left text-sm">
							<tr>
								<th className="px-4 py-3 font-medium">Name</th>
								<th className="px-4 py-3 font-medium">Category</th>
								<th className="px-4 py-3 font-medium">Price</th>
								<th className="px-4 py-3 font-medium">Usage</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
							{products.map((product) => (
								<tr key={product.productId} className={`hover:bg-[var(--accent)] ${!product.isActive ? "opacity-50" : ""}`}>
									<td className="px-4 py-3">
										<div>
											<div className="font-medium text-[var(--foreground)]">{product.name}</div>
											{product.description && (
												<div className="mt-0.5 text-xs text-[var(--muted-foreground)] line-clamp-1">
													{product.description}
												</div>
											)}
										</div>
									</td>
									<td className="px-4 py-3">
										<span className="inline-flex rounded-full bg-[var(--accent)] px-2 py-1 text-xs font-medium text-[var(--foreground)]">
											{getCategoryLabel(product.category)}
										</span>
									</td>
									<td className="px-4 py-3 text-sm text-[var(--foreground)]">
										{formatPrice(product.priceInCents, product.currency)}
									</td>
									<td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
										{product._count.calendarEvents} events, {product._count.registrations} registrations
									</td>
									<td className="px-4 py-3">
										{product.isActive ? (
											<span className="inline-flex items-center gap-1 text-xs text-green-600">
												<span className="h-2 w-2 rounded-full bg-green-600" />
												Active
											</span>
										) : (
											<span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
												<span className="h-2 w-2 rounded-full bg-gray-400" />
												Inactive
											</span>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-2">
											<button
												onClick={() => handleToggleActive(product)}
												disabled={toggleActiveMutation.isPending}
												className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50"
												aria-label={product.isActive ? "Deactivate product" : "Activate product"}
												title={product.isActive ? "Deactivate" : "Activate"}
											>
												{product.isActive
													? <ToggleRight size={16} className="text-green-600" />
													: <ToggleLeft size={16} />}
											</button>
											<button
												onClick={() => handleEdit(product)}
												className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
												aria-label="Edit product"
											>
												<Pencil size={16} />
											</button>
											<button
												onClick={() => handleDelete(product)}
												className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600"
												aria-label="Delete product"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Product Form Modal */}
			{isFormOpen && (
				<ProductFormModal
					product={editingProduct}
					onClose={handleCloseForm}
				/>
			)}
		</div>
	);
}
