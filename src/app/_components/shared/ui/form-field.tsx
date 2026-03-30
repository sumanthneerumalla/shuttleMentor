import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Minimal form field wrapper: label + children + optional error message.
 *
 * USE THIS to wrap any form input (<Input>, <Select>, <textarea>, etc.)
 * instead of manually repeating the label + error pattern inline.
 *
 * @example
 * <FormField label="Email" error={errors.email}>
 *   <Input value={email} onChange={...} />
 * </FormField>
 *
 * @example with optional hint
 * <FormField label="Bio" hint="Short overview for coach cards">
 *   <textarea ... />
 * </FormField>
 */
interface FormFieldProps {
	label: string;
	error?: string | null;
	hint?: string;
	children: React.ReactNode;
	className?: string;
	/** Makes the label visually hidden (still accessible to screen readers) */
	srOnly?: boolean;
}

function FormField({
	label,
	error,
	hint,
	children,
	className,
	srOnly,
}: FormFieldProps) {
	return (
		<div className={cn("space-y-1", className)}>
			<label
				className={cn(
					"block font-medium text-sm",
					srOnly ? "sr-only" : "text-gray-700",
				)}
			>
				{label}
			</label>
			{children}
			{hint && !error && (
				<p className="text-gray-500 text-xs">{hint}</p>
			)}
			{error && <p className="text-red-600 text-xs">{error}</p>}
		</div>
	);
}

export { FormField };
export type { FormFieldProps };
