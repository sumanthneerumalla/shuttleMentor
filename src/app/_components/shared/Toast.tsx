"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
	id: string;
	message: string;
	variant: ToastVariant;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const counterRef = useRef(0);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const toast = useCallback(
		(message: string, variant: ToastVariant = "info") => {
			const id = `toast-${++counterRef.current}`;
			setToasts((prev) => [...prev, { id, message, variant }]);
			setTimeout(() => dismiss(id), 5000);
		},
		[dismiss],
	);

	return { toasts, toast, dismiss };
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

const ICONS: Record<ToastVariant, React.ReactNode> = {
	success: <CheckCircle size={16} className="shrink-0 text-green-600" />,
	error: <AlertCircle size={16} className="shrink-0 text-[var(--destructive)]" />,
	info: <Info size={16} className="shrink-0 text-[var(--primary)]" />,
};

const BORDER_COLORS: Record<ToastVariant, string> = {
	success: "border-green-200",
	error: "border-red-200",
	info: "border-[var(--border)]",
};

function ToastItem({
	toast,
	onDismiss,
}: {
	toast: Toast;
	onDismiss: (id: string) => void;
}) {
	return (
		<div
			className={`glass-panel animate-slide-in-right flex w-full max-w-sm items-start gap-3 rounded-lg border p-3 ${BORDER_COLORS[toast.variant]}`}
			role="alert"
		>
			{ICONS[toast.variant]}
			<p className="flex-1 text-sm text-[var(--foreground)]">{toast.message}</p>
			<button
				onClick={() => onDismiss(toast.id)}
				className="shrink-0 rounded p-0.5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
				aria-label="Dismiss"
			>
				<X size={14} />
			</button>
		</div>
	);
}

// ─── Container ────────────────────────────────────────────────────────────────

export function ToastContainer({
	toasts,
	onDismiss,
}: {
	toasts: Toast[];
	onDismiss: (id: string) => void;
}) {
	if (toasts.length === 0) return null;

	return (
		<div
			className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6"
			aria-live="polite"
		>
			{toasts.map((t) => (
				<ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
			))}
		</div>
	);
}
