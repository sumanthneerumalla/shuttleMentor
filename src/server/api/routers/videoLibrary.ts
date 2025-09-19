import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, facilityProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { MediaType, UserType } from "@prisma/client";

// Zod schemas for input validation
const createVideoLibrarySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mediaType: z.nativeEnum(MediaType),
});

const updateVideoLibrarySchema = z.object({
  collectionId: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
});

const getVideoLibrarySchema = z.object({
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


export const videoLibraryRouter = createTRPCRouter({
  // Create a new video library
  create: protectedProcedure
    .input(createVideoLibrarySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.videoLibrary.create({
        data: {
          userId: ctx.auth.userId,
          title: input.title,
          description: input.description,
          mediaType: input.mediaType,
        },
      });
    }),

  // Get all video libraries for the current user
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.videoLibrary.findMany({
        where: {
          userId: ctx.auth.userId,
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
      return ctx.db.videoLibrary.findMany({
        where: {
          isDeleted: false, // Filter out soft-deleted libraries
        },
        include: {
          media: {
            where: {
              isDeleted: false, // Only include non-deleted media
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
  restoreLibrary: adminProcedure
    .input(getVideoLibrarySchema)
    .mutation(async ({ ctx, input }) => {
      const library = await ctx.db.videoLibrary.findUnique({
        where: {
          collectionId: input.collectionId,
        },
      });

      if (!library) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video library not found",
        });
      }

      return ctx.db.videoLibrary.update({
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
    .input(getVideoLibrarySchema)
    .query(async ({ ctx, input }) => {
      const library = await ctx.db.videoLibrary.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          media: {
            where: {
              isDeleted: false, // Only include non-deleted media
            },
          },
        },
      });

    // Note, this could leak privileged information about other users library ids
    // since we reveal if the library exists or not
      if (!library || library.isDeleted) { 
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video library not found",
        });
      }

      // Check if the user is authorized to view this library
      // Allow admins to view any library
      const user = await ctx.db.user.findUnique({
        where: { userId: ctx.auth.userId },
      });
      
      const isAdmin = user?.userType === UserType.ADMIN;

      
      if (library.userId !== ctx.auth.userId && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this library",
        });
      }

      return library;
    }),

  // Update a video library (admin only)
  update: adminProcedure
    .input(updateVideoLibrarySchema)
    .mutation(async ({ ctx, input }) => {
      const library = await ctx.db.videoLibrary.findUnique({
        where: {
          collectionId: input.collectionId,
        },
      });

      if (!library || library.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: library?.isDeleted ? "Video library is deleted" : "Video library not found",
        });
      }

      return ctx.db.videoLibrary.update({
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
    .input(getVideoLibrarySchema)
    .mutation(async ({ ctx, input }) => {
      const library = await ctx.db.videoLibrary.findUnique({
        where: {
          collectionId: input.collectionId,
        },
      });

      if (!library) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video library not found",
        });
      }

      // Check if the user is authorized to delete this library
      // Allow admins to delete any library
      const user = await ctx.db.user.findUnique({
        where: { userId: ctx.auth.userId },
      });
      
      const isAdmin = user?.userType === UserType.ADMIN;
      
      if (library.userId !== ctx.auth.userId && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this library",
        });
      }

      return ctx.db.videoLibrary.update({
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
      const library = await ctx.db.videoLibrary.findUnique({
        where: {
          collectionId: input.collectionId,
        },
        include: {
          media: true,
        },
      });

      if (!library || library.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: library?.isDeleted ? "Video library is deleted" : "Video library not found",
        });
      }

      // Check if the user is authorized to add media to this library
      // Allow admins to add media to any library
      const user = await ctx.db.user.findUnique({
        where: { userId: ctx.auth.userId },
      });
      
      const isAdmin = user?.userType === UserType.ADMIN;
      
      if (library.userId !== ctx.auth.userId && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to add media to this library",
        });
      }

      // Check if we're adding URL media and enforce the 3 video limit
      // Count only non-deleted media
      const activeMediaCount = library.media.filter(m => !m.isDeleted).length;
      if (library.mediaType === "URL_VIDEO" && activeMediaCount >= 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL video libraries are limited to 3 videos",
        });
      }

      // Validate that the media type matches the library type
      if (library.mediaType === "URL_VIDEO" && !input.videoUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL is required for URL video libraries",
        });
      }

      if (library.mediaType === "FILE_VIDEO" && !input.fileKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File information is required for file video libraries",
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

  // Get a single media item
  getMediaById: protectedProcedure
    .input(getMediaSchema)
    .query(async ({ ctx, input }) => {
      const media = await ctx.db.media.findUnique({
        where: {
          mediaId: input.mediaId,
        },
        include: {
          library: true,
        },
      });
      
      // Check if media doesn't exist or is soft-deleted (or its library is soft-deleted)
      if (!media || media.isDeleted || media.library.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media not found",
        });
      }

      // Check if the user is authorized to view this media
      // Allow admins to view any media
      const user = await ctx.db.user.findUnique({
        where: { userId: ctx.auth.userId },
      });
      
      const isAdmin = user?.userType === UserType.ADMIN;      
      if (media.library.userId !== ctx.auth.userId && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this media",
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
          library: true,
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
      const user = await ctx.db.user.findUnique({
        where: { userId: ctx.auth.userId },
      });
      
      const isAdmin = user?.userType === UserType.ADMIN;
      
      if (media.library.userId !== ctx.auth.userId && !isAdmin) {
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
});
