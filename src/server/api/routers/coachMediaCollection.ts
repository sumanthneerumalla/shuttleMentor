import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, facilityProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { MediaType, SharingType } from "@prisma/client";
import { 
  getCurrentUser, 
  isAdmin, 
  canCreateCoachCollections, 
  isCoachOrAdmin,
  isStudent,
  isFacility,
  validateCoachStudentSharing,
  validateFacilityCoachAccess,
  areInSameClub,
  requireCoachCollectionAccess,
  requireSharedCoachCollectionAccess
} from "~/server/utils/utils";

// Zod schemas for input validation
const createCoachMediaCollectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mediaType: z.nativeEnum(MediaType),
  sharingType: z.nativeEnum(SharingType).default(SharingType.SPECIFIC_STUDENTS),
  initialStudentIds: z.array(z.string()).optional(), // For initial sharing during creation
});

const updateCoachMediaCollectionSchema = z.object({
  collectionId: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  sharingType: z.nativeEnum(SharingType).optional(),
});

const getCoachMediaCollectionSchema = z.object({
  collectionId: z.string(),
});

const createCoachMediaSchema = z.object({
  collectionId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().url("Invalid URL format"),
  thumbnailUrl: z.string().url().optional(),
});

const updateCoachMediaSchema = z.object({
  mediaId: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  videoUrl: z.string().url("Invalid URL format").optional(),
  thumbnailUrl: z.string().url().optional(),
});

const getCoachMediaSchema = z.object({
  mediaId: z.string(),
});

const deleteCoachMediaSchema = z.object({
  mediaId: z.string(),
});

const shareWithStudentsSchema = z.object({
  collectionId: z.string(),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
});

const unshareFromStudentsSchema = z.object({
  collectionId: z.string(),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
});

const getClubStudentsSchema = z.object({
  clubId: z.string().optional(), // Optional - will use current user's club if not provided
});

const getSharedWithMeSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export const coachMediaCollectionRouter = createTRPCRouter({
  // Create a new coach media collection
  create: protectedProcedure
    .input(createCoachMediaCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Check if user is allowed to create coach collections
      if (!canCreateCoachCollections(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches and admins can create coach media collections.",
        });
      }

      try {
        // Create the collection
        const collection = await ctx.db.coachMediaCollection.create({
          data: {
            coachId: user.userId,
            title: input.title,
            description: input.description,
            mediaType: input.mediaType,
            sharingType: input.sharingType,
          },
          include: {
            coach: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                clubName: true,
                coachProfile: {
                  select: {
                    displayUsername: true,
                  },
                },
              },
            },
            media: {
              where: {
                isDeleted: false,
              },
            },
            sharedWith: {
              include: {
                student: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    studentProfile: {
                      select: {
                        displayUsername: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // Handle initial sharing if student IDs provided
        if (input.initialStudentIds && input.initialStudentIds.length > 0) {
          // Validate all students exist and are in the same club
          const students = await ctx.db.user.findMany({
            where: {
              userId: { in: input.initialStudentIds },
              userType: "STUDENT",
              clubId: user.clubId,
            },
          });

          if (students.length !== input.initialStudentIds.length) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Some students not found or not in the same club",
            });
          }

          // Create share relationships
          await ctx.db.coachCollectionShare.createMany({
            data: input.initialStudentIds.map(studentId => ({
              collectionId: collection.collectionId,
              studentId,
            })),
            skipDuplicates: true,
          });
        }

        return collection;
      } catch (error) {
        console.error("Error creating coach media collection:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create coach media collection. Please try again.",
        });
      }
    }),

  // Get all coach media collections for the current user
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Build where clause based on user type
      // Coaches see their own collections
      // Admins see all collections
      // Students and Facility users should not use this endpoint
      if (!isCoachOrAdmin(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches and admins can view coach collections via this endpoint.",
        });
      }

      const whereClause = isAdmin(user)
        ? { isDeleted: false }
        : {
            coachId: user.userId,
            isDeleted: false,
          };

      return ctx.db.coachMediaCollection.findMany({
        where: whereClause,
        include: {
          coach: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              clubName: true,
              coachProfile: {
                select: {
                  displayUsername: true,
                },
              },
            },
          },
          media: {
            where: {
              isDeleted: false,
            },
            take: 1, // Include just the first media item for thumbnail purposes
          },
          sharedWith: {
            include: {
              student: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  studentProfile: {
                    select: {
                      displayUsername: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get collections shared with the current student
  getSharedWithMe: protectedProcedure
    .input(getSharedWithMeSchema)
    .query(async ({ ctx, input }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Only students can use this endpoint
      if (!isStudent(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only students can view shared collections.",
        });
      }

      return ctx.db.coachMediaCollection.findMany({
        where: {
          isDeleted: false,
          sharedWith: {
            some: {
              studentId: user.userId,
            },
          },
        },
        include: {
          coach: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              clubName: true,
              coachProfile: {
                select: {
                  displayUsername: true,
                  profileImage: true,
                  profileImageType: true,
                },
              },
            },
          },
          media: {
            where: {
              isDeleted: false,
            },
            take: 1, // Include just the first media item for thumbnail purposes
          },
          sharedWith: {
            where: {
              studentId: user.userId,
            },
            select: {
              sharedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // Get a single coach media collection with all its media
  getById: protectedProcedure
    .input(getCoachMediaCollectionSchema)
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          coach: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              clubName: true,
              clubId: true,
              coachProfile: {
                select: {
                  displayUsername: true,
                  profileImage: true,
                  profileImageType: true,
                },
              },
            },
          },
          media: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          sharedWith: {
            include: {
              student: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  studentProfile: {
                    select: {
                      displayUsername: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // Check if user is the coach who owns the collection
      if (user.userId === collection.coachId) {
        return collection;
      }
      
      // Check if user is admin
      if (isAdmin(user)) {
        return collection;
      }
      
      // Check if user is facility user from same club
      if (isFacility(user)) {
        // Validate facility user can access coach collections from same club
        if (!areInSameClub(user, { clubId: collection.coach.clubId } as any)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Facility users can only access coach collections from the same club",
          });
        }
        return collection;
      }
      
      // Check if user is student with access to the collection
      if (isStudent(user)) {
        const isSharedWithUser = collection.sharedWith.some(share => share.studentId === user.userId);
        requireSharedCoachCollectionAccess(user, collection, isSharedWithUser);
        return collection;
      }

      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to access this coach collection",
      });
    }),

  // Update a coach media collection
  update: protectedProcedure
    .input(updateCoachMediaCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          coach: {
            select: {
              clubId: true,
            },
          },
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: collection?.isDeleted ? "Coach media collection is deleted" : "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only modify collections from coaches in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, collection);

      return ctx.db.coachMediaCollection.update({
        where: {
          collectionId: input.collectionId,
        },
        data: {
          title: input.title,
          description: input.description,
          sharingType: input.sharingType,
        },
        include: {
          coach: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              clubName: true,
              coachProfile: {
                select: {
                  displayUsername: true,
                },
              },
            },
          },
          media: {
            where: {
              isDeleted: false,
            },
          },
          sharedWith: {
            include: {
              student: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  studentProfile: {
                    select: {
                      displayUsername: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }),

  // Delete a coach media collection (soft delete)
  delete: protectedProcedure
    .input(getCoachMediaCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          coach: {
            select: {
              clubId: true,
            },
          },
        },
      });

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only delete collections from coaches in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, collection);

      // Soft delete the collection and remove all share relationships
      await ctx.db.$transaction([
        // Soft delete the collection
        ctx.db.coachMediaCollection.update({
          where: {
            collectionId: input.collectionId,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        }),
        // Remove all share relationships
        ctx.db.coachCollectionShare.deleteMany({
          where: {
            collectionId: input.collectionId,
          },
        }),
      ]);

      return { success: true };
    }),

  // Add media to a coach collection
  addMedia: protectedProcedure
    .input(createCoachMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          coach: {
            select: {
              clubId: true,
            },
          },
          media: {
            where: {
              isDeleted: false,
            },
          },
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: collection?.isDeleted ? "Coach media collection is deleted" : "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only add media to collections from coaches in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, collection);

      // Check if we're adding URL media and enforce the 3 video limit
      if (collection.mediaType === "URL_VIDEO" && collection.media.length >= 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL video collections are limited to 3 videos",
        });
      }

      // Validate that the media type matches the collection type
      if (collection.mediaType === "URL_VIDEO" && !input.videoUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL is required for URL video collections",
        });
      }

      return ctx.db.coachMedia.create({
        data: {
          collectionId: input.collectionId,
          title: input.title,
          description: input.description,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
        },
      });
    }),

  // Update coach media
  updateMedia: protectedProcedure
    .input(updateCoachMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.db.coachMedia.findUnique({
        where: {
          mediaId: input.mediaId,
        },
        include: {
          collection: {
            include: {
              coach: {
                select: {
                  clubId: true,
                },
              },
            },
          },
        },
      });

      if (!media || media.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: media?.isDeleted ? "Coach media is deleted" : "Coach media not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== media.collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only update media from collections in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, media.collection);

      return ctx.db.coachMedia.update({
        where: {
          mediaId: input.mediaId,
        },
        data: {
          title: input.title,
          description: input.description,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
        },
      });
    }),

  // Delete coach media (soft delete)
  deleteMedia: protectedProcedure
    .input(deleteCoachMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.db.coachMedia.findUnique({
        where: {
          mediaId: input.mediaId,
        },
        include: {
          collection: {
            include: {
              coach: {
                select: {
                  clubId: true,
                },
              },
            },
          },
        },
      });

      if (!media) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach media not found",
        });
      }

      if (media.isDeleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Coach media is already deleted",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== media.collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only delete media from collections in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, media.collection);

      return ctx.db.coachMedia.update({
        where: {
          mediaId: input.mediaId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    }),

  // Share collection with students
  shareWithStudents: protectedProcedure
    .input(shareWithStudentsSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          coach: {
            select: {
              clubId: true,
            },
          },
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only share collections from coaches in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, collection);

      // Validate all students exist and are in the same club
      const students = await ctx.db.user.findMany({
        where: {
          userId: { in: input.studentIds },
          userType: "STUDENT",
          clubId: user.clubId,
        },
      });

      if (students.length !== input.studentIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some students not found or not in the same club",
        });
      }

      // Validate coach-student sharing for each student
      students.forEach(student => {
        validateCoachStudentSharing(user, student);
      });

      // Create share relationships (skip duplicates)
      await ctx.db.coachCollectionShare.createMany({
        data: input.studentIds.map(studentId => ({
          collectionId: input.collectionId,
          studentId,
        })),
        skipDuplicates: true,
      });

      return { success: true, sharedCount: input.studentIds.length };
    }),

  // Share collection with all students in the club
  shareWithAllStudents: protectedProcedure
    .input(z.object({
      collectionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          coach: {
            select: {
              clubId: true,
            },
          },
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only share collections from coaches in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, collection);

      // Get all students from the same club
      const students = await ctx.db.user.findMany({
        where: {
          userType: "STUDENT",
          clubId: user.clubId,
        },
        select: {
          userId: true,
        },
      });

      if (students.length === 0) {
        return { success: true, sharedCount: 0 };
      }

      // Update collection sharing type to ALL_STUDENTS
      await ctx.db.coachMediaCollection.update({
        where: {
          collectionId: input.collectionId,
        },
        data: {
          sharingType: SharingType.ALL_STUDENTS,
        },
      });

      // Create share relationships for all students (skip duplicates)
      await ctx.db.coachCollectionShare.createMany({
        data: students.map(student => ({
          collectionId: input.collectionId,
          studentId: student.userId,
        })),
        skipDuplicates: true,
      });

      return { success: true, sharedCount: students.length };
    }),

  // Update sharing type and adjust shares accordingly
  updateSharingType: protectedProcedure
    .input(z.object({
      collectionId: z.string(),
      sharingType: z.nativeEnum(SharingType),
      studentIds: z.array(z.string()).optional(), // Required for SPECIFIC_STUDENTS
    }))
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      requireCoachCollectionAccess(user, collection);

      // Handle sharing type change
      if (input.sharingType === SharingType.ALL_STUDENTS) {
        // Get all students from the same club
        const students = await ctx.db.user.findMany({
          where: {
            userType: "STUDENT",
            clubId: user.clubId,
          },
          select: {
            userId: true,
          },
        });

        // Update collection sharing type
        await ctx.db.coachMediaCollection.update({
          where: {
            collectionId: input.collectionId,
          },
          data: {
            sharingType: SharingType.ALL_STUDENTS,
          },
        });

        // Create share relationships for all students (skip duplicates)
        if (students.length > 0) {
          await ctx.db.coachCollectionShare.createMany({
            data: students.map(student => ({
              collectionId: input.collectionId,
              studentId: student.userId,
            })),
            skipDuplicates: true,
          });
        }

        return { success: true, sharedCount: students.length };
      } else {
        // SPECIFIC_STUDENTS mode
        if (!input.studentIds || input.studentIds.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Student IDs are required for specific student sharing",
          });
        }

        // Validate all students exist and are in the same club
        const students = await ctx.db.user.findMany({
          where: {
            userId: { in: input.studentIds },
            userType: "STUDENT",
            clubId: user.clubId,
          },
        });

        if (students.length !== input.studentIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some students not found or not in the same club",
          });
        }

        // Update collection sharing type
        await ctx.db.coachMediaCollection.update({
          where: {
            collectionId: input.collectionId,
          },
          data: {
            sharingType: SharingType.SPECIFIC_STUDENTS,
          },
        });

        // Remove all existing shares
        await ctx.db.coachCollectionShare.deleteMany({
          where: {
            collectionId: input.collectionId,
          },
        });

        // Create new share relationships
        await ctx.db.coachCollectionShare.createMany({
          data: input.studentIds.map(studentId => ({
            collectionId: input.collectionId,
            studentId,
          })),
        });

        return { success: true, sharedCount: input.studentIds.length };
      }
    }),

  // Remove sharing from students
  unshareFromStudents: protectedProcedure
    .input(unshareFromStudentsSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.coachMediaCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          coach: {
            select: {
              clubId: true,
            },
          },
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach media collection not found",
        });
      }

      // Apply access control
      const user = await getCurrentUser(ctx);
      
      // For facility users, validate they're in the same club
      if (isFacility(user) && user.clubId !== collection.coach.clubId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Facility users can only unshare collections from coaches in the same club",
        });
      }
      
      requireCoachCollectionAccess(user, collection);

      // Remove share relationships
      const result = await ctx.db.coachCollectionShare.deleteMany({
        where: {
          collectionId: input.collectionId,
          studentId: { in: input.studentIds },
        },
      });

      return { success: true, unsharedCount: result.count };
    }),

  // Get students from the same club for sharing
  getClubStudents: protectedProcedure
    .input(getClubStudentsSchema)
    .query(async ({ ctx, input }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Only coaches and admins can get club students for sharing
      if (!isCoachOrAdmin(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches and admins can view club students.",
        });
      }

      const clubId = input.clubId || user.clubId;

      return ctx.db.user.findMany({
        where: {
          userType: "STUDENT",
          clubId: clubId,
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          studentProfile: {
            select: {
              displayUsername: true,
            },
          },
        },
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
        ],
      });
    }),

  // Get coach collections for facility users (read-only access)
  getFacilityCoachCollections: facilityProcedure
    .query(async ({ ctx }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Get all coach collections from the same club
      return ctx.db.coachMediaCollection.findMany({
        where: {
          isDeleted: false,
          coach: {
            clubId: user.clubId,
          },
        },
        include: {
          coach: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              clubName: true,
              coachProfile: {
                select: {
                  displayUsername: true,
                  profileImage: true,
                  profileImageType: true,
                },
              },
            },
          },
          media: {
            where: {
              isDeleted: false,
            },
            take: 1, // Include just the first media item for thumbnail purposes
          },
          sharedWith: {
            include: {
              student: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  studentProfile: {
                    select: {
                      displayUsername: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get coach collection metrics for dashboard
  getCoachCollectionMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Check if user is a coach or admin
      if (!isCoachOrAdmin(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches and admins can access collection metrics.",
        });
      }

      try {
        // Get total collections count
        const totalCollections = await ctx.db.coachMediaCollection.count({
          where: {
            coachId: user.userId,
            isDeleted: false,
          },
        });

        // Get total media count across all collections
        const totalMedia = await ctx.db.coachMedia.count({
          where: {
            collection: {
              coachId: user.userId,
              isDeleted: false,
            },
            isDeleted: false,
          },
        });

        // Get total students reached (unique students with access to any collection)
        const studentsReached = await ctx.db.coachCollectionShare.findMany({
          where: {
            collection: {
              coachId: user.userId,
              isDeleted: false,
            },
          },
          select: {
            studentId: true,
          },
          distinct: ['studentId'],
        });

        // Get most shared collection
        const collectionsWithShareCount = await ctx.db.coachMediaCollection.findMany({
          where: {
            coachId: user.userId,
            isDeleted: false,
          },
          include: {
            sharedWith: {
              select: {
                shareId: true,
              },
            },
            media: {
              where: {
                isDeleted: false,
              },
              select: {
                mediaId: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const mostSharedCollection = collectionsWithShareCount.reduce((max, collection) => {
          const shareCount = collection.sharedWith.length;
          return shareCount > (max?.shareCount || 0) 
            ? { ...collection, shareCount } 
            : max;
        }, null as (typeof collectionsWithShareCount[0] & { shareCount: number }) | null);

        return {
          totalCollections,
          totalMedia,
          studentsReached: studentsReached.length,
          mostSharedCollection: mostSharedCollection ? {
            collectionId: mostSharedCollection.collectionId,
            title: mostSharedCollection.title,
            shareCount: mostSharedCollection.shareCount,
            mediaCount: mostSharedCollection.media.length,
          } : null,
        };
      } catch (error) {
        console.error("Error fetching coach collection metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch collection metrics. Please try again.",
        });
      }
    }),
});