import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Styled <select> component matching the Input component's visual treatment.
 *
 * USE THIS instead of raw <select> elements with inline Tailwind classes.
 * Accepts all native <select> props plus optional className override.
 *
 * @example
 * <Select value={role} onChange={(e) => setRole(e.target.value)}>
 *   <option value="STUDENT">Student</option>
 *   <option value="COACH">Coach</option>
 * </Select>
 */
const Select = React.forwardRef<
	HTMLSelectElement,
	React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => {
	return (
		<select
			className={cn(
				"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
		</select>
	);
});
Select.displayName = "Select";

export { Select };
