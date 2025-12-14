import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, facilityProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { MediaType } from "@prisma/client";
import { getCurrentUser, isAdmin, canCreateCollections, canAccessResource } from "~/server/utils/utils";

// Helper functions are now imported from ~/server/utils/utils

// Zod schemas for input validation
const createVideoCollectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mediaType: z.nativeEnum(MediaType),
});

const updateVideoCollectionSchema = z.object({
  collectionId: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
});

const getVideoCollectionSchema = z.object({
  collectionId: z.string(),
});

const createMediaSchema = z.object({
  collectionId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().optional(),
  duration: z.number().int().optional(),
  thumbnailUrl: z.string().url().optional(),
});

const updateMediaSchema = z.object({
  mediaId: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
});

const getMediaSchema = z.object({
  mediaId: z.string(),
});

const deleteMediaSchema = z.object({
  mediaId: z.string(),
});

const getMediaForAuditSchema = z.object({
  mediaId: z.string(),
});


export const videoCollectionRouter = createTRPCRouter({
  // Create a new video library
  create: protectedProcedure
    .input(createVideoCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Check if user is allowed to create collections
      if (!canCreateCollections(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only students and admins can create video collections.",
        });
      }

      try {
        return await ctx.db.videoCollection.create({
          data: {
            userId: user.userId, // Use the verified user ID
            title: input.title,
            description: input.description,
            mediaType: input.mediaType,
          },
        });
      } catch (error) {
        console.error("Error creating video library:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create video collection. Please try again.",
        });
      }
    }),

  // Get all video libraries for the current user
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      return ctx.db.videoCollection.findMany({
        where: {
          userId: user.userId, // Use the internal user ID
          isDeleted: false, // Filter out soft-deleted libraries
        },
        include: {
          media: {
            where: {
              isDeleted: false, // Only include non-deleted media
            },
            take: 1, // Include just the first media item for thumbnail purposes
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
    
  // Admin endpoint to get all video libraries from all users
  getAllAdmin: adminProcedure
    .query(async ({ ctx }) => {
      return ctx.db.videoCollection.findMany({
        where: {
          isDeleted: false, // Filter out soft-deleted libraries
        },
        include: {
          media: {
            where: {
              isDeleted: false, // Only include non-deleted media
            },
            include: {
              coachingNotes: {
                include: {
                  coach: {
                    select: {
                      firstName: true,
                      lastName: true,
                      coachProfile: {
                        select: {
                          displayUsername: true,
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
            take: 1, // Include just the first media item for thumbnail purposes
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
    
  // Admin endpoint to restore a soft-deleted library
  restoreCollection: adminProcedure
    .input(getVideoCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.videoCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
      });

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video collection not found",
        });
      }

      return ctx.db.videoCollection.update({
        where: {
          collectionId: input.collectionId,
        },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });
    }),

  // Get a single video library with all its media
  getById: protectedProcedure
    .input(getVideoCollectionSchema)
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.videoCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          media: {
            where: {
              isDeleted: false, // Only include non-deleted media
            },
            include: {
              coachingNotes: {
                include: {
                  coach: {
                    select: {
                      firstName: true,
                      lastName: true,
                      coachProfile: {
                        select: {
                          displayUsername: true,
                          profileImage: true,
                          profileImageType: true,
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      });

    // Note, this could leak privileged information about other users library ids
    // since we reveal if the library exists or not
      if (!collection || collection.isDeleted) { 
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video collection not found",
        });
      }

      // Check if the user is authorized to view this library
      // Allow admins and coaches to view any library
      const user = await getCurrentUser(ctx);
      const userIsAdmin = isAdmin(user);
      const isCoach = user.userType === "COACH";
      
      // Check if the collection belongs to the current user or user has coaching privileges
      if (collection.userId !== user.userId && !userIsAdmin && !isCoach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this collection",
        });
      }

      return collection;
    }),

  // Update a video library (admin only)
  update: adminProcedure
    .input(updateVideoCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.videoCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: collection?.isDeleted ? "Video collection is deleted" : "Video collection not found",
        });
      }

      return ctx.db.videoCollection.update({
        where: {
          collectionId: input.collectionId,
        },
        data: {
          title: input.title,
          description: input.description,
        },
      });
    }),

  // Delete a video library
  delete: protectedProcedure
    .input(getVideoCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.videoCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
      });

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video collection not found",
        });
      }

      // Check if the user is authorized to delete this library
      // Allow admins to delete any library
      const user = await getCurrentUser(ctx);
      const userIsAdmin = isAdmin(user);
      
      // Check if the collection belongs to the current user
      if (collection.userId !== user.userId && !userIsAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this collection",
        });
      }

      return ctx.db.videoCollection.update({
        where: {
          collectionId: input.collectionId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    }),

  // Add media to a library
  addMedia: protectedProcedure
    .input(createMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await ctx.db.videoCollection.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          media: true,
        },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: collection?.isDeleted ? "Video collection is deleted" : "Video collection not found",
        });
      }

      // Check if the user is authorized to add media to this library
      // Allow admins to add media to any library
      const user = await getCurrentUser(ctx);
      const userIsAdmin = isAdmin(user);
      
      // Check if the collection belongs to the current user
      if (collection.userId !== user.userId && !userIsAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to add media to this collection",
        });
      }

      // Check if we're adding URL media and enforce the 3 video limit
      // Count only non-deleted media
      const activeMediaCount = collection.media.filter((m: any) => !m.isDeleted).length;
      if (collection.mediaType === "URL_VIDEO" && activeMediaCount >= 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL video collections are limited to 3 videos",
        });
      }

      // Validate that the media type matches the library type
      if (collection.mediaType === "URL_VIDEO" && !input.videoUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL is required for URL video collections",
        });
      }

      if (collection.mediaType === "FILE_VIDEO" && !input.fileKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File information is required for file video collections",
        });
      }

      return ctx.db.media.create({
        data: {
          collectionId: input.collectionId,
          title: input.title,
          description: input.description,
          videoUrl: input.videoUrl,
          fileKey: input.fileKey,
          fileName: input.fileName,
          fileSize: input.fileSize,
          duration: input.duration,
          thumbnailUrl: input.thumbnailUrl,
        },
      });
    }),

  // Get a single media item with coaching notes
  getMediaById: protectedProcedure
    .input(getMediaSchema)
    .query(async ({ ctx, input }) => {
      const media = await ctx.db.media.findUnique({
        where: {
          mediaId: input.mediaId,
        },
        include: {
          collection: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          coachingNotes: {
            include: {
              coach: {
                select: {
                  firstName: true,
                  lastName: true,
                  coachProfile: {
                    select: {
                      displayUsername: true,
                      profileImage: true,
                      profileImageType: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
      
      if (!media) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media not found",
        });
      }

      // Check if the user is authorized to view this media
      const user = await getCurrentUser(ctx);
      const userIsAdmin = isAdmin(user);
      const isCoach = user.userType === "COACH";
      
      // Allow owners, coaches, and admins to view media
      if (media.collection.userId !== user.userId && !userIsAdmin && !isCoach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this media",
        });
      }

      // For soft-deleted media, only allow coaches and admins to access for audit purposes
      if ((media.isDeleted || media.collection.isDeleted) && !userIsAdmin && !isCoach) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media not found",
        });
      }

      return media;
    }),

  // Update media (admin only)
  updateMedia: adminProcedure
    .input(updateMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.db.media.findUnique({
        where: {
          mediaId: input.mediaId,
        },
      });

      if (!media) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media not found",
        });
      }

      return ctx.db.media.update({
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

  // Delete media
  deleteMedia: protectedProcedure
    .input(deleteMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.db.media.findUnique({
        where: {
          mediaId: input.mediaId,
        },
        include: {
          collection: true,
        },
      });

      if (!media) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media not found",
        });
      }
      
      // Check if media is already deleted
      if (media.isDeleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Media is already deleted",
        });
      }

      // Check if the user is authorized to delete this media
      // Allow admins to delete any media
      const user = await getCurrentUser(ctx);
      const userIsAdmin = isAdmin(user);
      
      // Check if the media belongs to the current user
      if (media.collection.userId !== user.userId && !userIsAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this media",
        });
      }

      return ctx.db.media.update({
        where: {
          mediaId: input.mediaId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    }),
    
  // Admin endpoint to restore a soft-deleted media item
  restoreMedia: adminProcedure
    .input(getMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.db.media.findUnique({
        where: {
          mediaId: input.mediaId,
        },
      });

      if (!media) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media not found",
        });
      }

      return ctx.db.media.update({
        where: {
          mediaId: input.mediaId,
        },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });
    }),

  // Get all media for coaches to review (coaches and admins only)
  getAllMediaForCoaches: protectedProcedure
    .query(async ({ ctx }) => {
      // Get the current user
      const user = await getCurrentUser(ctx);

      // Check if user has coaching privileges (COACH or ADMIN only)
      if (user.userType !== "COACH" && user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches and admins can view all student media.",
        });
      }

      return ctx.db.media.findMany({
        where: {
          isDeleted: false,
          collection: {
            isDeleted: false,
          },
        },
        include: {
          collection: {
            select: {
              title: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          coachingNotes: {
            include: {
              coach: {
                select: {
                  firstName: true,
                  lastName: true,
                  coachProfile: {
                    select: {
                      displayUsername: true,
                      profileImage: true,
                      profileImageType: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get media for audit purposes (includes soft-deleted media with coaching notes)
  getMediaForAudit: adminProcedure
    .input(getMediaForAuditSchema)
    .query(async ({ ctx, input }) => {
      const media = await ctx.db.media.findUnique({
        where: {
          mediaId: input.mediaId,
        },
        include: {
          collection: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          coachingNotes: {
            include: {
              coach: {
                select: {
                  firstName: true,
                  lastName: true,
                  coachProfile: {
                    select: {
                      displayUsername: true,
                      profileImage: true,
                      profileImageType: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
      
      // Allow access to soft-deleted media for audit purposes
      if (!media) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media not found",
        });
      }

      return media;
    }),
});
