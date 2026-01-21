import { TRPCError } from "@trpc/server";
import type { User } from "@prisma/client";
import { UserType } from "@prisma/client";

// Define a simplified context type for our helper functions
export type ContextWithAuth = {
  db: {
    user: {
      findUnique: (args: { where: { clerkUserId: string } }) => Promise<User | null>;
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
 * Helper function to check if user is a coach
 * @param user The user object to check
 * @returns Boolean indicating if user has coach role
 */
export function isCoach(user: User): boolean {
  return user.userType === UserType.COACH;
}

/**
 * Helper function to check if user is a coach or admin
 * @param user The user object to check
 * @returns Boolean indicating if user has coach or admin role
 */
export function isCoachOrAdmin(user: User): boolean {
  return user.userType === UserType.COACH || user.userType === UserType.ADMIN;
}

/**
 * Helper function to check if user is a facility user
 * @param user The user object to check
 * @returns Boolean indicating if user has facility role
 */
export function isFacility(user: User): boolean {
  return user.userType === UserType.FACILITY;
}

/**
 * Helper function to check if user is a student
 * @param user The user object to check
 * @returns Boolean indicating if user has student role
 */
export function isStudent(user: User): boolean {
  return user.userType === UserType.STUDENT;
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
 * Helper function to check if user can create coach collections
 * @param user The user object to check
 * @returns Boolean indicating if user can create coach collections
 */
export function canCreateCoachCollections(user: User): boolean {
  return isCoachOrAdmin(user) || isFacility(user);
}

/**
 * Helper function to check if user is a coach, facility, or admin
 * @param user The user object to check
 * @returns Boolean indicating if user has coach, facility, or admin role
 */
export function isCoachFacilityOrAdmin(user: User): boolean {
  return user.userType === UserType.COACH || user.userType === UserType.FACILITY || user.userType === UserType.ADMIN;
}

/**
 * Helper function to check if user is a coach or facility
 * @param user The user object to check
 * @returns Boolean indicating if user has coach or facility role
 */
export function isCoachOrFacility(user: User): boolean {
  return user.userType === UserType.COACH || user.userType === UserType.FACILITY;
}

/**
 * Helper function to validate if two users belong to the same club
 * @param user1 First user to compare
 * @param user2 Second user to compare
 * @returns Boolean indicating if users are in the same club
 */
export function areInSameClub(user1: User, user2: User): boolean {
  return user1.clubId === user2.clubId;
}

/**
 * Helper function to validate if a coach or facility can share with a user (same club)
 * @param creator The coach or facility user creating the share
 * @param targetUser The student or coach user to share with
 * @returns Boolean indicating if sharing is allowed
 * @throws TRPCError if users are not in the same club or roles are invalid
 */
export function validateCoachStudentSharing(creator: User, targetUser: User): boolean {
  // Validate creator role
  if (!isCoachFacilityOrAdmin(creator)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only coaches, facility managers, and admins can share collections",
    });
  }

  // Validate target user role (can be student or coach)
  if (!isStudent(targetUser) && !isCoach(targetUser)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Collections can only be shared with students or coaches",
    });
  }

  // Validate same club
  if (!areInSameClub(creator, targetUser)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Collections can only be shared with users from the same club",
    });
  }

  return true;
}

/**
 * Helper function to validate if a facility user can access coach collections
 * @param facilityUser The facility user
 * @param coach The coach whose collections are being accessed
 * @returns Boolean indicating if access is allowed
 * @throws TRPCError if users are not in the same club or roles are invalid
 */
export function validateFacilityCoachAccess(facilityUser: User, coach: User): boolean {
  // Validate facility role
  if (!isFacility(facilityUser)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only facility users can access coach collections in this context",
    });
  }

  // Validate coach role
  if (!isCoachOrAdmin(coach)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Target user must be a coach or admin",
    });
  }

  // Validate same club
  if (!areInSameClub(facilityUser, coach)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Facility users can only access coach collections from the same club",
    });
  }

  return true;
}

/**
 * Helper function to filter users by club and role
 * @param users Array of users to filter
 * @param clubId Club ID to filter by
 * @param userType Optional user type to filter by
 * @returns Filtered array of users
 */
export function filterUsersByClubAndRole(users: User[], clubId: string, userType?: UserType): User[] {
  return users.filter(user => {
    const matchesClub = user.clubId === clubId;
    const matchesRole = userType ? user.userType === userType : true;
    return matchesClub && matchesRole;
  });
}

/**
 * Helper function to check if user can access a specific resource
 * @param user The current user
 * @param resourceOwnerId The user ID of the resource owner
 * @returns Boolean indicating if the user can access the resource
 */
export function canAccessResource(user: User, resourceOwnerId: string): boolean {
  return user.userId === resourceOwnerId || isAdmin(user);
}

/**
 * Helper function to check if user can access a coach collection
 * @param user The current user
 * @param collection The coach collection with owner info
 * @returns Boolean indicating if user has access
 */
export function canAccessCoachCollection(user: User, collection: { coachId: string }): boolean {
  // Check if user is collection owner (coach)
  if (user.userId === collection.coachId) {
    return true;
  }
  
  // Check if user is admin
  if (isAdmin(user)) {
    return true;
  }
  
  // Check if user is facility user from same club (requires additional club validation)
  if (isFacility(user)) {
    return true; // Club validation should be done separately in the calling code
  }
  
  return false;
}

/**
 * Helper function to check if student or coach can access a shared coach collection
 * @param user The current user (should be student or coach)
 * @param collection The coach collection
 * @param isSharedWithUser Boolean indicating if collection is shared with the user
 * @returns Boolean indicating if user has access
 */
export function canAccessSharedCoachCollection(user: User, collection: { coachId: string }, isSharedWithUser: boolean): boolean {
  // Students and coaches can access collections shared with them
  if ((isStudent(user) || isCoach(user)) && isSharedWithUser) {
    return true;
  }
  
  // Coaches, facility users, and admins can access their own collections
  if (canAccessCoachCollection(user, collection)) {
    return true;
  }
  
  return false;
}

/**
 * Throws appropriate authorization error for coach collection access
 * @param user The current user
 * @param collection The coach collection with owner info
 * @throws TRPCError if user doesn't have access
 */
export function requireCoachCollectionAccess(user: User, collection: { coachId: string }): void {
  if (!canAccessCoachCollection(user, collection)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this coach collection",
    });
  }
}

/**
 * Throws appropriate authorization error for shared coach collection access
 * @param user The current user
 * @param collection The coach collection
 * @param isSharedWithUser Boolean indicating if collection is shared with the user
 * @throws TRPCError if user doesn't have access
 */
export function requireSharedCoachCollectionAccess(user: User, collection: { coachId: string }, isSharedWithUser: boolean): void {
  if (!canAccessSharedCoachCollection(user, collection, isSharedWithUser)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this coach collection",
    });
  }
}

/**
 * Access control middleware for video collections
 * Checks if user is collection owner or assigned coach
 * @param user The current user
 * @param collection The video collection with assigned coach info
 * @returns Boolean indicating if user has access
 */
export function canAccessVideoCollection(user: User, collection: { userId: string; assignedCoachId?: string | null }): boolean {
  // Check if user is collection owner
  if (user.userId === collection.userId) {
    return true;
  }
  
  // Check if user is assigned coach
  if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
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
export function requireVideoCollectionAccess(user: User, collection: { userId: string; assignedCoachId?: string | null }): void {
  if (!canAccessVideoCollection(user, collection)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this collection",
    });
  }
}

/**
 * Helper function to process base64 image data
 * @param imageData Base64 encoded image data
 * @param maxSizeBytes Maximum allowed size in bytes
 * @returns Buffer containing the binary image data
 * @throws TRPCError if image exceeds maximum size or if imageData is undefined
 */
/**
 * Helper function to convert binary image data to a base64 data URL
 * @param imageData Binary image data
 * @param mimeType MIME type of the image
 * @returns Base64 encoded data URL
 */
export function binaryToBase64DataUrl(imageData: Buffer | Uint8Array | null, mimeType: string = 'image/png'): string | null {
  if (!imageData) return null;
  
  try {
    // Convert binary data to base64 string
    const base64String = Buffer.from(imageData).toString('base64');
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error converting binary to base64:', error);
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
export function processBase64Image(imageData: string, maxSizeBytes: number = 3 * 1024 * 1024): Buffer {
  // Validate input
  if (!imageData) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No image data provided",
    });
  }
  
  try {
    // Extract the base64 data (remove the data:image/png;base64, prefix if present)
    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;
    
    // Convert base64 to binary - ensure base64Data is a string
    const binaryData = Buffer.from(base64Data as string, 'base64');
    
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
