import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind CSS classes
 * - Combines classes with clsx for conditional classes
 * - Uses tailwind-merge to resolve class conflicts
 * - Maintains the same API as the original cn function
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isOnboardedUser(user: {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
}): boolean {
	const firstName = user.firstName?.trim() ?? "";
	const lastName = user.lastName?.trim() ?? "";
	const email = user.email?.trim() ?? "";

	return firstName.length > 0 && lastName.length > 0 && email.length > 0;
}
