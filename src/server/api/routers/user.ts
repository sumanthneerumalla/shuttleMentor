import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { UserType } from "@prisma/client";

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
          await ctx.db.coachProfile.create({
            data: {
              userId: user.userId,
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
        // Create default coach profile if missing
        await ctx.db.coachProfile.create({
          data: {
            userId: user.userId,
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

      // Return user with only the appropriate profile based on userType
      // Admins can see both profiles
      // We've already verified user is not null above, so we can safely assert it's non-null
      const nonNullUser = user as NonNullable<typeof user>;
      
      if (nonNullUser.userType === UserType.ADMIN) {
        return nonNullUser;
      } else if (nonNullUser.userType === UserType.COACH) {
        return {
          ...nonNullUser,
          studentProfile: null,
        };
      } else {
        // STUDENT type
        return {
          ...nonNullUser,
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
          await ctx.db.coachProfile.create({
            data: {
              userId: user.userId,
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
        await ctx.db.coachProfile.create({
          data: {
            userId: user.userId,
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
      skillLevel: z.string().optional(),
      goals: z.string().optional(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Create student profile if it doesn't exist
      const existingProfile = await ctx.db.studentProfile.findUnique({
        where: { userId: user.userId },
      });

      if (!existingProfile) {
        return ctx.db.studentProfile.create({
          data: {
            userId: user.userId,
            ...input,
          },
        });
      }

      return ctx.db.studentProfile.update({
        where: { userId: user.userId },
        data: input,
      });
    }),

  // Update coach profile
  updateCoachProfile: protectedProcedure
    .input(z.object({
      bio: z.string().optional(),
      experience: z.string().optional(),
      specialties: z.array(z.string()).optional(),
      teachingStyles: z.array(z.string()).optional(),
      headerImage: z.union([z.string().url(), z.string().length(0), z.null()]).optional(),
      rate: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Create coach profile if it doesn't exist
      const existingProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: user.userId },
      });

      if (!existingProfile) {
        return ctx.db.coachProfile.create({
          data: {
            userId: user.userId,
            rate: input.rate || 0,
            specialties: input.specialties || [],
            teachingStyles: input.teachingStyles || [],
            bio: input.bio,
            experience: input.experience,
            headerImage: input.headerImage,
          },
        });
      }

      return ctx.db.coachProfile.update({
        where: { userId: user.userId },
        data: input,
      });
    }),
});