import { MediaCoachNoteType, UserType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { extractYouTubeId } from "~/lib/videoUtils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { canAccessVideoCollection, getCurrentUser } from "~/server/utils/utils";

// Zod schemas for input validation
const youtubeUrlSchema = z
	.string()
	.trim()
	.url("Please enter a valid URL")
	.refine((url) => {
		try {
			const host = new URL(url).hostname.toLowerCase();
			return (
				host === "youtube.com" ||
				host === "www.youtube.com" ||
				host === "youtu.be"
			);
		} catch {
			return false;
		}
	}, "Only youtube.com or youtu.be links are supported")
	.refine(
		(url) => extractYouTubeId(url) !== null,
		"Please enter a valid YouTube video URL",
	);

const createNoteSchema = z
	.object({
		mediaId: z.string().min(1, "Media ID is required"),
		noteType: z.nativeEnum(MediaCoachNoteType).default(MediaCoachNoteType.TEXT),
		noteContent: z
			.string()
			.trim()
			.max(2000, "Note content must be 2000 characters or less")
			.optional(),
		videoUrl: youtubeUrlSchema.optional(),
	})
	.superRefine((val, ctx) => {
		if (val.noteType === MediaCoachNoteType.TEXT) {
			if (!val.noteContent || val.noteContent.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Note content is required",
					path: ["noteContent"],
				});
			}
			if (val.videoUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Video URL is not allowed for text notes",
					path: ["videoUrl"],
				});
			}
		}

		if (val.noteType === MediaCoachNoteType.YOUTUBE) {
			if (!val.videoUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "YouTube URL is required",
					path: ["videoUrl"],
				});
			}
			if (val.noteContent && val.noteContent.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Note content is not allowed for YouTube notes",
					path: ["noteContent"],
				});
			}
		}
	});

const updateNoteSchema = z
	.object({
		noteId: z.string().min(1, "Note ID is required"),
		noteType: z.nativeEnum(MediaCoachNoteType).default(MediaCoachNoteType.TEXT),
		noteContent: z
			.string()
			.trim()
			.max(2000, "Note content must be 2000 characters or less")
			.optional(),
		videoUrl: youtubeUrlSchema.optional(),
	})
	.superRefine((val, ctx) => {
		if (val.noteType === MediaCoachNoteType.TEXT) {
			if (!val.noteContent || val.noteContent.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Note content is required",
					path: ["noteContent"],
				});
			}
			if (val.videoUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Video URL is not allowed for text notes",
					path: ["videoUrl"],
				});
			}
		}

		if (val.noteType === MediaCoachNoteType.YOUTUBE) {
			if (!val.videoUrl) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "YouTube URL is required",
					path: ["videoUrl"],
				});
			}
			if (val.noteContent && val.noteContent.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Note content is not allowed for YouTube notes",
					path: ["noteContent"],
				});
			}
		}
	});

const deleteNoteSchema = z.object({
	noteId: z.string().min(1, "Note ID is required"),
});

const getNotesByMediaSchema = z.object({
	mediaId: z.string().min(1, "Media ID is required"),
});

/**
 * Helper function to check if user has coach or admin privileges
 */
function hasCoachingPrivileges(userType: UserType): boolean {
	return userType === UserType.COACH || userType === UserType.ADMIN;
}

export const coachingNotesRouter = createTRPCRouter({
	// Create a new coaching note
	createNote: protectedProcedure
		.input(createNoteSchema)
		.mutation(async ({ ctx, input }) => {
			// Get the current user
			const user = await getCurrentUser(ctx);

			// Verify that the media exists and is not soft-deleted
			const media = await ctx.db.media.findUnique({
				where: {
					mediaId: input.mediaId,
					isDeleted: false,
					collection: {
						isDeleted: false,
					},
				},
				include: {
					collection: {
						include: {
							user: {
								select: {
									clubShortName: true,
								},
							},
						},
					},
				},
			});

			if (!media) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Media not found or has been deleted.",
				});
			}

			// Check if user has coaching privileges (COACH or ADMIN only) or is the collection owner/uploader
			if (
				!hasCoachingPrivileges(user.userType) &&
				media.collection.userId !== user.userId &&
				media.collection.uploadedByUserId !== user.userId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Only coaches, admins, collection owners, and uploaders can create coaching notes.",
				});
			}

			try {
				return await ctx.db.mediaCoachNote.create({
					data: {
						mediaId: input.mediaId,
						coachId: user.userId,
						noteType: input.noteType,
						noteContent:
							input.noteType === MediaCoachNoteType.TEXT
								? (input.noteContent ?? null)
								: null,
						videoUrl:
							input.noteType === MediaCoachNoteType.YOUTUBE
								? (input.videoUrl ?? null)
								: null,
					},
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
						media: {
							select: {
								title: true,
								collection: {
									select: {
										title: true,
									},
								},
							},
						},
					},
				});
			} catch (error) {
				console.error("Error creating coaching note:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create coaching note. Please try again.",
				});
			}
		}),

	// Update an existing coaching note
	updateNote: protectedProcedure
		.input(updateNoteSchema)
		.mutation(async ({ ctx, input }) => {
			// Get the current user
			const user = await getCurrentUser(ctx);

			// Check if user has coaching privileges (COACH or ADMIN only)
			if (!hasCoachingPrivileges(user.userType)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches and admins can update coaching notes.",
				});
			}

			// Find the existing note
			const existingNote = await ctx.db.mediaCoachNote.findUnique({
				where: {
					noteId: input.noteId,
					media: {
						isDeleted: false,
						collection: {
							isDeleted: false,
						},
					},
				},
				include: {
					media: {
						include: {
							collection: true,
						},
					},
				},
			});

			if (!existingNote) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coaching note not found or media has been deleted.",
				});
			}

			// Check if the user owns this note or is an admin
			if (
				existingNote.coachId !== user.userId &&
				user.userType !== UserType.ADMIN
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only update your own coaching notes.",
				});
			}

			try {
				return await ctx.db.mediaCoachNote.update({
					where: { noteId: input.noteId },
					data: {
						noteType: input.noteType,
						noteContent:
							input.noteType === MediaCoachNoteType.TEXT
								? (input.noteContent ?? null)
								: null,
						videoUrl:
							input.noteType === MediaCoachNoteType.YOUTUBE
								? (input.videoUrl ?? null)
								: null,
						// updatedAt is automatically updated by Prisma
					},
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
						media: {
							select: {
								title: true,
								collection: {
									select: {
										title: true,
									},
								},
							},
						},
					},
				});
			} catch (error) {
				console.error("Error updating coaching note:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update coaching note. Please try again.",
				});
			}
		}),

	// Delete a coaching note
	deleteNote: protectedProcedure
		.input(deleteNoteSchema)
		.mutation(async ({ ctx, input }) => {
			// Get the current user
			const user = await getCurrentUser(ctx);

			// Check if user has coaching privileges (COACH or ADMIN only)
			if (!hasCoachingPrivileges(user.userType)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only coaches and admins can delete coaching notes.",
				});
			}

			// Find the existing note
			const existingNote = await ctx.db.mediaCoachNote.findUnique({
				where: { noteId: input.noteId },
			});

			if (!existingNote) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coaching note not found.",
				});
			}

			// Check if the user owns this note or is an admin
			if (
				existingNote.coachId !== user.userId &&
				user.userType !== UserType.ADMIN
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only delete your own coaching notes.",
				});
			}

			try {
				await ctx.db.mediaCoachNote.delete({
					where: { noteId: input.noteId },
				});

				return {
					success: true,
					message: "Coaching note deleted successfully.",
				};
			} catch (error) {
				console.error("Error deleting coaching note:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete coaching note. Please try again.",
				});
			}
		}),

	// Get all coaching notes for a specific media item
	getNotesByMedia: protectedProcedure
		.input(getNotesByMediaSchema)
		.query(async ({ ctx, input }) => {
			// Get the current user
			const user = await getCurrentUser(ctx);

			// Verify that the media exists and is not soft-deleted
			const media = await ctx.db.media.findUnique({
				where: {
					mediaId: input.mediaId,
					isDeleted: false,
					collection: {
						isDeleted: false,
					},
				},
				include: {
					collection: true,
				},
			});

			if (!media) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Media not found or has been deleted.",
				});
			}

			// Check if user has access to this media
			// Students can only see notes on their own media
			// Coaches and admins can see notes on any media
			const isOwner = media.collection.userId === user.userId;
			const hasCoachingAccess = hasCoachingPrivileges(user.userType);
			const hasFacilityAccess =
				user.userType === UserType.FACILITY &&
				canAccessVideoCollection(user, media.collection);

			if (!isOwner && !hasCoachingAccess && !hasFacilityAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You are not authorized to view coaching notes for this media.",
				});
			}

			try {
				return await ctx.db.mediaCoachNote.findMany({
					where: { mediaId: input.mediaId },
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
						createdAt: "desc", // Most recent notes first
					},
				});
			} catch (error) {
				console.error("Error fetching coaching notes:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch coaching notes. Please try again.",
				});
			}
		}),
});
