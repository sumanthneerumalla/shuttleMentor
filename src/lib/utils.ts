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

// ---------------------------------------------------------------------------
// Role helpers — pure functions, safe for both server and client components.
// Accepts any object with a userType string (Prisma User, tRPC response, etc.)
// ---------------------------------------------------------------------------

type HasUserType = { userType: string };

export function isPlatformAdmin(user: HasUserType): boolean {
	return user.userType === "PLATFORM_ADMIN";
}

export function isClubAdmin(user: HasUserType): boolean {
	return user.userType === "CLUB_ADMIN";
}

export function isAnyAdmin(user: HasUserType): boolean {
	return isPlatformAdmin(user) || isClubAdmin(user);
}

export function isFacilityOrAbove(user: HasUserType): boolean {
	return user.userType === "FACILITY" || isAnyAdmin(user);
}

export function isStaffOrAbove(user: HasUserType): boolean {
	return isFacilityOrAbove(user) || user.userType === "COACH";
}

/** Coach, club admin, or platform admin — for coaching notes, dashboard metrics, media access */
export function hasCoachingAccess(user: HasUserType): boolean {
	return user.userType === "COACH" || isAnyAdmin(user);
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
