import type { PrismaClient, User } from "@prisma/client";
import { UserType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Define a simplified context type for our helper functions
export type ContextWithAuth = {
	db: {
		user: {
			findUnique: (args: {
				where: { clerkUserId: string };
			}) => Promise<User | null>;
		};
	};
	auth: {
		userId: string;
	};
};

/**
 * Helper function to get the current user or throw an error
 * @param ctx The tRPC context with auth and database access
 * @returns The current user object
 * @throws TRPCError if user is not found
 */
export async function getCurrentUser(ctx: ContextWithAuth): Promise<User> {
	const user = await ctx.db.user.findUnique({
		where: { clerkUserId: ctx.auth.userId },
	});

	if (!user) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "User not found. Please complete your profile setup first.",
		});
	}

	return user;
}

/**
 * Helper function to check if user is admin
 * @param user The user object to check
 * @returns Boolean indicating if user has admin role
 */
export function isAdmin(user: User): boolean {
	return user.userType === UserType.ADMIN;
}

/**
 * Helper function to check if user can create collections
 * @param user The user object to check
 * @returns Boolean indicating if user can create collections
 */
export function canCreateCollections(user: User): boolean {
	return user.userType === UserType.STUDENT || user.userType === UserType.ADMIN;
}

/**
 * Helper function to check if user can access a specific resource
 * @param user The current user
 * @param resourceOwnerId The user ID of the resource owner
 * @returns Boolean indicating if the user can access the resource
 */
export function canAccessResource(
	user: User,
	resourceOwnerId: string,
): boolean {
	return user.userId === resourceOwnerId || isAdmin(user);
}

/**
 * Access control middleware for video collections
 * Checks if user is collection owner or assigned coach
 * @param user The current user
 * @param collection The video collection with assigned coach info
 * @returns Boolean indicating if user has access
 */
export function canAccessVideoCollection(
	user: User,
	collection: {
		userId: string;
		assignedCoachId?: string | null;
		uploadedByUserId?: string | null;
		user?: { clubShortName?: string | null } | null;
	},
): boolean {
	// Check if user is collection owner
	if (user.userId === collection.userId) {
		return true;
	}

	// Check if user is assigned coach
	if (
		collection.assignedCoachId &&
		user.userId === collection.assignedCoachId
	) {
		return true;
	}

	// Check if user uploaded the collection on behalf of the owner
	if (
		collection.uploadedByUserId &&
		user.userId === collection.uploadedByUserId
	) {
		return true;
	}

	// Facility users can view collections owned by users in the same club
	if (
		user.userType === UserType.FACILITY &&
		collection.user?.clubShortName &&
		user.clubShortName === collection.user.clubShortName
	) {
		return true;
	}

	// Check if user is admin
	if (isAdmin(user)) {
		return true;
	}

	return false;
}

/**
 * Throws appropriate authorization error for video collection access
 * @param user The current user
 * @param collection The video collection with assigned coach info
 * @throws TRPCError if user doesn't have access
 */
export function requireVideoCollectionAccess(
	user: User,
	collection: {
		userId: string;
		assignedCoachId?: string | null;
		uploadedByUserId?: string | null;
		user?: { clubShortName?: string | null } | null;
	},
): void {
	if (!canAccessVideoCollection(user, collection)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to access this collection",
		});
	}
}

/**
 * Validates that a club exists and returns its full information
 * @param db Prisma client
 * @param clubShortName The club identifier to validate
 * @returns Club information
 * @throws TRPCError if club doesn't exist
 */
export async function validateAndGetClub(
	db: PrismaClient,
	clubShortName: string,
): Promise<{ clubShortName: string; clubName: string }> {
	const club = await db.club.findUnique({
		where: { clubShortName },
		select: { clubShortName: true, clubName: true },
	});

	if (!club) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid club identifier",
		});
	}

	return club;
}

/**
 * Checks if two entities are in the same club
 * @param user User with clubShortName
 * @param other Entity with optional clubShortName
 * @returns true if both are in the same club
 */
export function isSameClub(
	user: { clubShortName: string },
	other: { clubShortName?: string | null },
): boolean {
	return !!other.clubShortName && user.clubShortName === other.clubShortName;
}

/**
 * Helper function to convert binary image data to a base64 data URL
 * @param imageData Binary image data
 * @param mimeType MIME type of the image
 * @returns Base64 encoded data URL
 */
export function binaryToBase64DataUrl(
	imageData: Buffer | Uint8Array | null,
	mimeType = "image/png",
): string | null {
	if (!imageData) return null;

	try {
		// Convert binary data to base64 string
		const base64String = Buffer.from(imageData).toString("base64");
		return `data:${mimeType};base64,${base64String}`;
	} catch (error) {
		console.error("Error converting binary to base64:", error);
		return null;
	}
}

/**
 * Process a base64 image string into a Buffer
 * @param imageData Base64 encoded image data or data URL
 * @param maxSizeBytes Maximum allowed size in bytes (default: 3MB)
 * @returns Buffer containing the binary image data
 * @throws TRPCError if image exceeds maximum size or if imageData is undefined
 */
export function processBase64Image(
	imageData: string,
	maxSizeBytes: number = 3 * 1024 * 1024,
): Buffer {
	// Validate input
	if (!imageData) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No image data provided",
		});
	}

	try {
		// Extract the base64 data (remove the data:image/png;base64, prefix if present)
		const base64Data = imageData.includes("base64,")
			? imageData.split("base64,")[1]
			: imageData;

		// Convert base64 to binary - ensure base64Data is a string
		const binaryData = Buffer.from(base64Data as string, "base64");

		// Check size
		if (binaryData.length > maxSizeBytes) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Image size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`,
			});
		}

		return binaryData;
	} catch (error) {
		if (error instanceof TRPCError) throw error;

		console.error("Error processing base64 image:", error);
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid image data format",
		});
	}
}
