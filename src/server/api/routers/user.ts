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

      return user;
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
      return ctx.db.user.update({
        where: { clerkUserId: ctx.auth.userId },
        data: input,
        include: {
          studentProfile: true,
          coachProfile: true,
        },
      });
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
      });

      // Create the appropriate profile if it doesn't exist
      if (input.userType === UserType.STUDENT && !user.studentProfile) {
        await ctx.db.studentProfile.create({
          data: {
            userId: user.userId,
          },
        });
      } else if (input.userType === UserType.COACH && !user.coachProfile) {
        await ctx.db.coachProfile.create({
          data: {
            userId: user.userId,
            hourlyRate: 0, // Default rate, should be updated by coach
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
      headerImage: z.string().url().optional(),
      hourlyRate: z.number().positive().optional(),
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
            hourlyRate: input.hourlyRate || 0,
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