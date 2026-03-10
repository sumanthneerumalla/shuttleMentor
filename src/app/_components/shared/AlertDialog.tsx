"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "~/app/_components/shared/Button";

interface AlertDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function AlertDialog({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = false,
	onConfirm,
	onCancel,
}: AlertDialogProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onCancel}
			/>

			{/* Dialog */}
			<div className="relative z-10 w-full max-w-sm rounded-xl glass-panel border border-[var(--border)] shadow-xl p-6 space-y-4">
				<div className="flex items-start gap-3">
					{destructive && (
						<AlertTriangle
							size={20}
							className="mt-0.5 shrink-0 text-[var(--destructive)]"
						/>
					)}
					<div className="space-y-1">
						<h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
						<p className="text-sm text-[var(--muted-foreground)]">{description}</p>
					</div>
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="outline" size="sm" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button
						size="sm"
						onClick={onConfirm}
						className={destructive ? "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-red-600 border-transparent" : ""}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
