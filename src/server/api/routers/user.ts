import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { UserType } from "@prisma/client";
import { getCurrentUser, isAdmin, canAccessResource, processBase64Image, binaryToBase64DataUrl } from "~/server/utils/utils";
import { generateUniqueUsername } from "~/server/utils/generateUsername";
import { TRPCError } from "@trpc/server";

/**
 * Helper function to process profile image data from input
 * @param profileImageData Base64 encoded image data
 * @returns Object containing binary data and image type, or null if no image provided, or explicit null to delete
 */
function processProfileImageInput(profileImageData?: string): { profileImage: Buffer; profileImageType: string } | null | { profileImage: null } {
  // If undefined, return null (no change)
  if (profileImageData === undefined) return null;
  
  // If empty string, return explicit null to delete the image
  if (profileImageData === '') {
    return { profileImage: null };
  }
  
  try {
    // Process the image data for a valid base64 string
    const binaryData = processBase64Image(profileImageData);
    return {
      profileImage: binaryData,
      profileImageType: "image/png"
    };
  } catch (error) {
    console.error("Error processing profile image:", error);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Failed to process profile image",
    });
  }
}

/**
 * Helper function to prepare profile data for saving
 * @param input Input data with possible profileImage field
 * @returns Prepared data object with processed image data if available
 */
function prepareProfileData<T extends { profileImage?: string }>(input: T): Omit<T, 'profileImage'> & { profileImage?: Buffer | null; profileImageType?: string } {
  // Process profile image if provided
  const processedImage = processProfileImageInput(input.profileImage);
  
  // Prepare data object, excluding profileImage from input
  const { profileImage, ...profileData } = input;
  
  // Create the base return object with proper type
  const result = { ...profileData } as Omit<T, 'profileImage'> & { profileImage?: Buffer | null; profileImageType?: string };
  
  // Handle different cases based on processedImage result
  if (processedImage) {
    // Set profileImage (could be null for deletion)
    result.profileImage = processedImage.profileImage;
    
    // Only set profileImageType if it exists (won't exist for deletion case)
    if ('profileImageType' in processedImage) {
      result.profileImageType = processedImage.profileImageType;
    }
  }
  
  return result;
}

/**
 * Helper function to retrieve and convert profile image to base64
 * @param profileImage Binary profile image data
 * @param profileImageType MIME type of the image
 * @returns Base64 encoded image data URL or null if no image
 */
function getProfileImageBase64(profileImage?: Buffer | null, profileImageType: string = 'image/png'): string | null {
  if (!profileImage) return null;
  
  try {
    // Convert binary data to base64 for frontend use
    const base64Data = Buffer.from(profileImage).toString('base64');
    return `data:${profileImageType};base64,${base64Data}`;
  } catch (error) {
    console.error("Error converting profile image to base64:", error);
    return null;
  }
}

export const userRouter = createTRPCRouter({
  // Get or create user profile on first sign-in
  getOrCreateProfile: protectedProcedure
    .query(async ({ ctx }) => {
      // First, always try to find existing user
      let user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
        include: {
          studentProfile: true,
          coachProfile: true,
        },
      });

      if (!user) {
        try {
          // Use upsert to handle race conditions - if two requests come in simultaneously,
          // only one will create the user, the other will return the existing one
          user = await ctx.db.user.upsert({
            where: { clerkUserId: ctx.auth.userId },
            update: {}, // Do nothing if it exists
            create: { 
              clerkUserId: ctx.auth.userId,
              userType: UserType.STUDENT, // Default to student
            },
            include: {
              studentProfile: true,
              coachProfile: true,
            },
          });
          
          console.log(`Created new user profile for Clerk user: ${ctx.auth.userId}`);
        } catch (error) {
          // If there's a unique constraint violation, fetch the existing user
          // This handles the extremely rare case of a race condition
          user = await ctx.db.user.findUnique({
            where: { clerkUserId: ctx.auth.userId },
            include: {
              studentProfile: true,
              coachProfile: true,
            },
          });
          
          if (!user) {
            throw new Error("Failed to create or retrieve user profile");
          }
        }
      }

      // Verify user exists before proceeding
      if (!user) {
        throw new Error("Critical error: User should exist by this point but doesn't. This indicates a serious issue with user creation logic.");
      }

      // Create default profiles based on user type if they don't exist
      if (user.userType === UserType.ADMIN) {
        // Admin users should have both profiles
        if (!user.studentProfile) {
          await ctx.db.studentProfile.create({
            data: {
              userId: user.userId,
              skillLevel: "Intermediate",
              goals: "Improve overall badminton skills and techniques",
              bio: "Admin user with access to all platform features",
            },
          });
        }
        if (!user.coachProfile) {
          // Create coach profile with inline username generation
          await ctx.db.coachProfile.create({
            data: {
              userId: user.userId,
              displayUsername: await generateUniqueUsername(user, ctx.db),
              rate: 50,
              bio: "Admin user with coaching capabilities",
              experience: "Platform administrator with coaching access",
              specialties: ["Administration", "Platform Management"],
              teachingStyles: ["Flexible", "Adaptive"],
            },
          });
        }
        // Refetch user with profiles
        user = await ctx.db.user.findUnique({
          where: { clerkUserId: ctx.auth.userId },
          include: {
            studentProfile: true,
            coachProfile: true,
          },
        });
      } else if (user.userType === UserType.STUDENT && !user.studentProfile) {
        // Create default student profile if missing
        await ctx.db.studentProfile.create({
          data: {
            userId: user.userId,
            skillLevel: "Beginner",
            goals: "Learn and improve badminton skills",
            bio: "New badminton student eager to learn",
          },
        });
        user = await ctx.db.user.findUnique({
          where: { clerkUserId: ctx.auth.userId },
          include: {
            studentProfile: true,
            coachProfile: true,
          },
        });
      } else if (user.userType === UserType.COACH && !user.coachProfile) {
        // Create default coach profile if missing with inline username generation
        await ctx.db.coachProfile.create({
          data: {
            userId: user.userId,
            displayUsername: await generateUniqueUsername(user, ctx.db),
            rate: 40,
            bio: "Experienced badminton coach",
            experience: "Several years of badminton coaching experience",
            specialties: ["Fundamentals", "Technique"],
            teachingStyles: ["Patient", "Structured"],
          },
        });
        user = await ctx.db.user.findUnique({
          where: { clerkUserId: ctx.auth.userId },
          include: {
            studentProfile: true,
            coachProfile: true,
          },
        });
      }

      // We've already verified user is not null above, so we can safely assert it's non-null
      const nonNullUser = user as NonNullable<typeof user>;
      
      // Define types for frontend-optimized profiles
      type StudentProfileForFrontend = {
        studentProfileId: string;
        displayUsername: string | null;
        skillLevel: string | null;
        goals: string | null;
        bio: string | null;
        profileImageUrl?: string | null;
      };
      
      type CoachProfileForFrontend = {
        coachProfileId: string;
        displayUsername: string | null;
        bio: string | null;
        experience: string | null;
        specialties: string[];
        teachingStyles: string[];
        headerImage: string | null;
        rate: number;
        isVerified: boolean;
        profileImageUrl?: string | null;
      };
      
      type UserForFrontend = {
        userId: string;
        clerkUserId: string;
        email?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        profileImage?: string | null;
        timeZone?: string | null;
        createdAt: Date;
        updatedAt: Date;
        userType: typeof nonNullUser.userType;
        studentProfile: StudentProfileForFrontend | null;
        coachProfile: CoachProfileForFrontend | null;
      };
      
      // Create a processed user object with deep clones of the profiles
      let processedUser: UserForFrontend = {
        ...nonNullUser,
        studentProfile: nonNullUser.studentProfile ? { ...nonNullUser.studentProfile } : null,
        coachProfile: nonNullUser.coachProfile ? { ...nonNullUser.coachProfile } : null,
      };
      
      // Process profile images for display in the UI and remove binary data
      if (nonNullUser.studentProfile?.profileImage) {
        const profileImageUrl = binaryToBase64DataUrl(
          nonNullUser.studentProfile.profileImage,
          nonNullUser.studentProfile.profileImageType || 'image/png'
        );
        
        // Create student profile with the correct type and fields
        if (processedUser.studentProfile) {
          processedUser = {
            ...processedUser,
            studentProfile: {
              studentProfileId: nonNullUser.studentProfile.studentProfileId,
              displayUsername: nonNullUser.studentProfile.displayUsername,
              skillLevel: nonNullUser.studentProfile.skillLevel,
              goals: nonNullUser.studentProfile.goals,
              bio: nonNullUser.studentProfile.bio,
              profileImageUrl
            }
          };
        }
      }
      
      if (nonNullUser.coachProfile?.profileImage) {
        const profileImageUrl = binaryToBase64DataUrl(
          nonNullUser.coachProfile.profileImage,
          nonNullUser.coachProfile.profileImageType || 'image/png'
        );
        
        // Create coach profile with the correct type and fields
        if (processedUser.coachProfile) {
          processedUser = {
            ...processedUser,
            coachProfile: {
              coachProfileId: nonNullUser.coachProfile.coachProfileId,
              displayUsername: nonNullUser.coachProfile.displayUsername,
              bio: nonNullUser.coachProfile.bio,
              experience: nonNullUser.coachProfile.experience,
              specialties: nonNullUser.coachProfile.specialties,
              teachingStyles: nonNullUser.coachProfile.teachingStyles,
              headerImage: nonNullUser.coachProfile.headerImage,
              rate: nonNullUser.coachProfile.rate,
              isVerified: nonNullUser.coachProfile.isVerified,
              profileImageUrl
            }
          };
        }
      }
      
      // Return user with only the appropriate profile based on userType
      // Admins can see both profiles
      // We've already verified user is not null above, so we can safely assert it's non-null
      
      if (processedUser.userType === UserType.ADMIN) {
        return processedUser;
      } else if (processedUser.userType === UserType.COACH) {
        return {
          ...processedUser,
          studentProfile: null,
        };
      } else {
        // STUDENT type
        return {
          ...processedUser,
          coachProfile: null,
        };
      }
    }),
    
  // Update basic user profile
  updateProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      profileImage: z.string().url().optional(),
      timeZone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { clerkUserId: ctx.auth.userId },
        data: input,
        include: {
          studentProfile: true,
          coachProfile: true,
        },
      });

      // Return user with only the appropriate profile based on userType
      // Verify user exists before proceeding
      if (!user) {
        throw new Error("Critical error: User should exist by this point but doesn't.");
      }
      
      if (user.userType === UserType.ADMIN) {
        return user;
      } else if (user.userType === UserType.COACH) {
        return {
          ...user,
          studentProfile: null,
        };
      } else {
        return {
          ...user,
          coachProfile: null,
        };
      }
    }),

  // Switch user type (student/coach)
  switchUserType: protectedProcedure
    .input(z.object({
      userType: z.nativeEnum(UserType),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { clerkUserId: ctx.auth.userId },
        data: { userType: input.userType },
        include: {
          studentProfile: true,
          coachProfile: true,
        },
      });

      // Create the appropriate profile(s) if they don't exist
      if (input.userType === UserType.ADMIN) {
        // Admin users should have both profiles
        if (!user.studentProfile) {
          await ctx.db.studentProfile.create({
            data: {
              userId: user.userId,
              skillLevel: "Intermediate",
              goals: "Improve overall badminton skills and techniques",
              bio: "Admin user with access to all platform features",
            },
          });
        }
        if (!user.coachProfile) {
          // Create coach profile with inline username generation
          await ctx.db.coachProfile.create({
            data: {
              userId: user.userId,
              displayUsername: await generateUniqueUsername(user, ctx.db),
              rate: 50,
              bio: "Admin user with coaching capabilities",
              experience: "Platform administrator with coaching access",
              specialties: ["Administration", "Platform Management"],
              teachingStyles: ["Flexible", "Adaptive"],
            },
          });
        }
      } else if (input.userType === UserType.STUDENT && !user.studentProfile) {
        await ctx.db.studentProfile.create({
          data: {
            userId: user.userId,
            skillLevel: "Beginner",
            goals: "Learn and improve badminton skills",
            bio: "New badminton student eager to learn",
          },
        });
      } else if (input.userType === UserType.COACH && !user.coachProfile) {
        // Create coach profile with inline username generation
        await ctx.db.coachProfile.create({
          data: {
            userId: user.userId,
            displayUsername: await generateUniqueUsername(user, ctx.db),
            rate: 40,
            bio: "Experienced badminton coach",
            experience: "Several years of badminton coaching experience",
            specialties: ["Fundamentals", "Technique"],
            teachingStyles: ["Patient", "Structured"],
          },
        });
      }

      return ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
        include: {
          studentProfile: true,
          coachProfile: true,
        },
      });
    }),

  // Update student profile
  updateStudentProfile: protectedProcedure
    .input(z.object({
      displayUsername: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be 30 characters or less")
        .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and can only contain letters, numbers, and underscores")
        .transform(val => val.toLowerCase()) // Store as lowercase
        .optional(),
      skillLevel: z.string().optional(),
      goals: z.string().optional(),
      bio: z.string().optional(),
      profileImage: z.string()
        .refine(
          (val) => !val || val.length <= 5 * 1024 * 1024, // 5MB in bytes (approximated in base64)
          "Profile image must be 5MB or less"
        )
        .optional(), // Base64 encoded image data
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }
      
      // Prepare data for saving using helper function
      const dataToSave = prepareProfileData(input);
      
      // Create student profile if it doesn't exist
      const existingProfile = await ctx.db.studentProfile.findUnique({
        where: { userId: user.userId },
      });

      if (!existingProfile) {
        return ctx.db.studentProfile.create({
          data: {
            userId: user.userId,
            ...dataToSave,
          },
        });
      }

      return ctx.db.studentProfile.update({
        where: { userId: user.userId },
        data: dataToSave,
      });
    }),

  // Update coach profile
  updateCoachProfile: protectedProcedure
    .input(z.object({
      displayUsername: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be 30 characters or less")
        .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and can only contain letters, numbers, and underscores")
        .transform(val => val.toLowerCase()) // Store as lowercase
        .optional(),
      bio: z.string().max(300, "Bio must be 300 characters or less").optional(),
      experience: z.string().max(1000, "Experience must be 1000 characters or less").optional(),
      specialties: z.array(z.string()).optional(),
      teachingStyles: z.array(z.string()).optional(),
      headerImage: z.union([z.string().url(), z.string().length(0), z.null()]).optional(),
      rate: z.number().int().min(0).optional(),
      profileImage: z.string()
        .refine(
          (val) => !val || val.length <= 5 * 1024 * 1024, // 5MB in bytes (approximated in base64)
          "Profile image must be 5MB or less"
        )
        .optional(), // Base64 encoded image data
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }
      
      // Prepare data for saving using helper function
      const dataToSave = prepareProfileData(input);
      
      // Create coach profile if it doesn't exist
      const existingProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: user.userId },
      });

      if (!existingProfile) {
        // If no displayUsername is provided, generate one inline
        if (!dataToSave.displayUsername) {
          dataToSave.displayUsername = await generateUniqueUsername(user, ctx.db);
        }
        
        return ctx.db.coachProfile.create({
          data: {
            userId: user.userId,
            // Use defaults for required fields
            rate: dataToSave.rate || 0,
            specialties: dataToSave.specialties || [],
            teachingStyles: dataToSave.teachingStyles || [],
            // Use the rest of the data as is
            ...dataToSave,
          },
        });
      }

      return ctx.db.coachProfile.update({
        where: { userId: user.userId },
        data: dataToSave,
      });
    }),
});
