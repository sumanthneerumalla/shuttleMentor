import { UserType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getCurrentWeekRange } from "~/server/utils/dateUtils";
import { generateUniqueUsername } from "~/server/utils/generateUsername";
import {
	canAccessResource,
	formatUserForFrontend,
	getCurrentUser,
	isAdmin,
	processBase64Image,
	validateAndGetClub,
} from "~/server/utils/utils";

/**
 * Helper function to process profile image data from input
 * @param profileImageData Base64 encoded image data
 * @returns Object containing binary data and image type, or null if no image provided, or explicit null to delete
 */
function processProfileImageInput(
	profileImageData?: string,
):
	| { profileImage: Buffer; profileImageType: string }
	| null
	| { profileImage: null } {
	// If undefined, return null (no change)
	if (profileImageData === undefined) return null;

	// If empty string, return explicit null to delete the image
	if (profileImageData === "") {
		return { profileImage: null };
	}

	try {
		// Process the image data for a valid base64 string
		const binaryData = processBase64Image(profileImageData);
		return {
			profileImage: binaryData,
			profileImageType: "image/png",
		};
	} catch (error) {
		console.error("Error processing profile image:", error);
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				error instanceof Error
					? error.message
					: "Failed to process profile image",
		});
	}
}

/**
 * Helper function to prepare profile data for saving
 * @param input Input data with possible profileImage field
 * @returns Prepared data object with processed image data if available
 */
function prepareProfileData<T extends { profileImage?: string }>(
	input: T,
): Omit<T, "profileImage"> & {
	profileImage?: Uint8Array | null;
	profileImageType?: string;
} {
	// Process profile image if provided
	const processedImage = processProfileImageInput(input.profileImage);

	// Prepare data object, excluding profileImage from input
	const { profileImage, ...profileData } = input;

	// Create the base return object with proper type
	const result = { ...profileData } as Omit<T, "profileImage"> & {
		profileImage?: Uint8Array | null;
		profileImageType?: string;
	};

	// Handle different cases based on processedImage result
	if (processedImage) {
		// Set profileImage (could be null for deletion)
		if (processedImage.profileImage === null) {
			result.profileImage = null;
		} else {
			// Convert Buffer to Uint8Array for Prisma with proper ArrayBuffer
			const buffer = processedImage.profileImage.buffer.slice(
				processedImage.profileImage.byteOffset,
				processedImage.profileImage.byteOffset +
					processedImage.profileImage.byteLength,
			);
			result.profileImage = new Uint8Array(buffer);
		}

		// Only set profileImageType if it exists (won't exist for deletion case)
		if ("profileImageType" in processedImage) {
			result.profileImageType = processedImage.profileImageType;
		}
	}

	return result;
}

// ============================================================
// INPUT SCHEMAS
// ============================================================

const updateProfileSchema = z.object({
	firstName: z
		.string()
		.min(1)
		.max(100)
		.trim()
		.regex(/^[\p{L}\p{M}' -]+$/u, "Name contains invalid characters")
		.optional(),
	lastName: z
		.string()
		.min(1)
		.max(100)
		.trim()
		.regex(/^[\p{L}\p{M}' -]+$/u, "Name contains invalid characters")
		.optional(),
	email: z.string().email().optional(),
	profileImage: z.string().url().optional(),
	timeZone: z
		.string()
		.regex(/^\/|^[A-Za-z]+(\/[A-Za-z_]+)+$|^UTC$/, "Invalid timezone")
		.optional(),
	clubShortName: z
		.string()
		.regex(
			/^[a-zA-Z0-9-]+$/,
			"Club ID must contain only alphanumeric characters and hyphens",
		)
		.min(1, "Club ID must be at least 1 character")
		.max(50, "Club ID must be 50 characters or less")
		.optional(),
});

const updateStudentProfileSchema = z.object({
	displayUsername: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(30, "Username must be 30 characters or less")
		.regex(
			/^[a-zA-Z][a-zA-Z0-9_]*$/,
			"Username must start with a letter and can only contain letters, numbers, and underscores",
		)
		.transform((val) => val.toLowerCase())
		.optional(),
	skillLevel: z.string().optional(),
	goals: z.string().optional(),
	bio: z.string().optional(),
	profileImage: z
		.string()
		.refine(
			(val) => !val || val.length <= 5 * 1024 * 1024,
			"Profile image must be 5MB or less",
		)
		.optional(),
});

const updateCoachProfileSchema = z.object({
	displayUsername: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(30, "Username must be 30 characters or less")
		.regex(
			/^[a-zA-Z][a-zA-Z0-9_]*$/,
			"Username must start with a letter and can only contain letters, numbers, and underscores",
		)
		.transform((val) => val.toLowerCase())
		.optional(),
	bio: z.string().max(300, "Bio must be 300 characters or less").optional(),
	experience: z
		.string()
		.max(1000, "Experience must be 1000 characters or less")
		.optional(),
	specialties: z.array(z.string()).optional(),
	teachingStyles: z.array(z.string()).optional(),
	headerImage: z
		.union([z.string().url(), z.string().length(0), z.null()])
		.optional(),
	rate: z.number().int().min(0).optional(),
	profileImage: z
		.string()
		.refine(
			(val) => !val || val.length <= 5 * 1024 * 1024,
			"Profile image must be 5MB or less",
		)
		.optional(),
});

const switchUserTypeSchema = z.object({
	userType: z.nativeEnum(UserType),
});

// ============================================================

export const userRouter = createTRPCRouter({
	// Get or create user profile on first sign-in
	getOrCreateProfile: protectedProcedure.query(async ({ ctx }) => {
		// First, always try to find existing user
		let user = await ctx.db.user.findUnique({
			where: { clerkUserId: ctx.auth.userId },
			include: {
				studentProfile: true,
				coachProfile: true,
				club: true,
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
						club: true,
					},
				});

				console.log(
					`Created new user profile for Clerk user: ${ctx.auth.userId}`,
				);

				// Backfill per-facility UserClub rows for the default club
				if (user.clubShortName) {
					const defaultFacilities = await ctx.db.clubFacility.findMany({
						where: { clubShortName: user.clubShortName, isActive: true },
						orderBy: { position: "asc" },
						select: { facilityId: true },
					});

					for (const f of defaultFacilities) {
						await ctx.db.userClub.upsert({
							where: {
								userId_facilityId: {
									userId: user.userId,
									facilityId: f.facilityId,
								},
							},
							create: {
								userId: user.userId,
								clubShortName: user.clubShortName,
								facilityId: f.facilityId,
								role: user.userType,
							},
							update: {},
						});
					}

					// Set active facility if not already set
					if (!user.activeFacilityId && defaultFacilities[0]) {
						await ctx.db.user.update({
							where: { userId: user.userId },
							data: { activeFacilityId: defaultFacilities[0].facilityId },
						});
						user = await ctx.db.user.findUnique({
							where: { clerkUserId: ctx.auth.userId },
							include: {
								studentProfile: true,
								coachProfile: true,
								club: true,
							},
						});
						if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
					}
				}
			} catch (error) {
				// If there's a unique constraint violation, fetch the existing user
				// This handles the extremely rare case of a race condition
				user = await ctx.db.user.findUnique({
					where: { clerkUserId: ctx.auth.userId },
					include: {
						studentProfile: true,
						coachProfile: true,
						club: true,
					},
				});

				if (!user) {
					throw new Error("Failed to create or retrieve user profile");
				}
			}
		}

		// Verify user exists before proceeding
		if (!user) {
			throw new Error(
				"Critical error: User should exist by this point but doesn't. This indicates a serious issue with user creation logic.",
			);
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
					club: true,
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
					club: true,
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
					club: true,
				},
			});
		}

		return formatUserForFrontend(user as NonNullable<typeof user>);
	}),

	// Update basic user profile
	updateProfile: protectedProcedure
		.input(updateProfileSchema)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await getCurrentUser(ctx);

			const sanitizedClubShortName = input.clubShortName?.trim().toLowerCase();

			// Handle clubShortName changes
			// the short name on the database expected to always be lowercase
			if (
				sanitizedClubShortName &&
				sanitizedClubShortName !== currentUser.clubShortName
			) {
				// Admins can always change club
				// Non-admins can only set club if they're on the default club
				if (
					!isAdmin(currentUser) &&
					currentUser.clubShortName !== "shuttlementor"
				) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only admins can change club.",
					});
				}

				// Validate the new club exists
				await validateAndGetClub(ctx.db, sanitizedClubShortName);
			}

			const dataToUpdate = {
				firstName: input.firstName,
				lastName: input.lastName,
				email: input.email,
				profileImage: input.profileImage,
				timeZone: input.timeZone,
				clubShortName: sanitizedClubShortName,
			};

			const user = await ctx.db.user.update({
				where: { clerkUserId: ctx.auth.userId },
				data: dataToUpdate,
				include: {
					studentProfile: true,
					coachProfile: true,
					club: true,
				},
			});

			return formatUserForFrontend(user);
		}),

	// Returns a list of clubs for selector UIs.
	// scope="all"         → all clubs in the system (admin-only).
	// scope="memberships" → only the clubs the calling user has joined (any role, no admin gate).
	getAvailableClubs: protectedProcedure
		.input(
			z
				.object({
					scope: z.enum(["all", "memberships"]).optional().default("all"),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const user = await getCurrentUser(ctx);
			const scope = input?.scope ?? "all";

			if (scope === "all" && !isAdmin(user)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only admins can view all available clubs.",
				});
			}

			if (scope === "memberships") {
				const memberships = await ctx.db.userClub.findMany({
					where: { userId: user.userId },
					include: {
						club: { select: { clubShortName: true, clubName: true } },
					},
					orderBy: { club: { clubName: "asc" } },
				});

				return memberships
					.map((m: { clubShortName: string; club: { clubShortName: string; clubName: string } }) => ({
						clubShortName: m.club.clubShortName,
						clubName: m.club.clubName,
					}))
					.filter(
						(c) =>
							c.clubShortName.trim().length > 0 &&
							c.clubName.trim().length > 0,
					);
			}

			const clubs = await ctx.db.club.findMany({
				select: {
					clubShortName: true,
					clubName: true,
				},
				orderBy: {
					clubName: "asc",
				},
			});

			return clubs
				.map((club) => ({
					clubShortName: club.clubShortName,
					clubName: club.clubName,
				}))
				.filter(
					(c) =>
						c.clubShortName.trim().length > 0 && c.clubName.trim().length > 0,
				)
				.sort((a, b) => a.clubName.localeCompare(b.clubName));
		}),

	// Switch user type (student/coach)
	switchUserType: protectedProcedure
		.input(switchUserTypeSchema)
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
		.input(updateStudentProfileSchema)
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
				const createData: any = {
					userId: user.userId,
					displayUsername: dataToSave.displayUsername,
					skillLevel: dataToSave.skillLevel,
					goals: dataToSave.goals,
					bio: dataToSave.bio,
					profileImageType: dataToSave.profileImageType,
				};

				if (dataToSave.profileImage !== undefined) {
					createData.profileImage = dataToSave.profileImage;
				}

				return ctx.db.studentProfile.create({
					data: createData,
				});
			}

			const updateData: any = {
				displayUsername: dataToSave.displayUsername,
				skillLevel: dataToSave.skillLevel,
				goals: dataToSave.goals,
				bio: dataToSave.bio,
				profileImageType: dataToSave.profileImageType,
			};

			if (dataToSave.profileImage !== undefined) {
				updateData.profileImage = dataToSave.profileImage;
			}

			return ctx.db.studentProfile.update({
				where: { userId: user.userId },
				data: updateData,
			});
		}),

	// Update coach profile
	updateCoachProfile: protectedProcedure
		.input(updateCoachProfileSchema)
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
				const displayUsername =
					dataToSave.displayUsername ||
					(await generateUniqueUsername(user, ctx.db));

				const createData: any = {
					userId: user.userId,
					displayUsername,
					bio: dataToSave.bio,
					experience: dataToSave.experience,
					specialties: dataToSave.specialties || [],
					teachingStyles: dataToSave.teachingStyles || [],
					headerImage: dataToSave.headerImage,
					rate: dataToSave.rate || 0,
					profileImageType: dataToSave.profileImageType,
				};

				if (dataToSave.profileImage !== undefined) {
					createData.profileImage = dataToSave.profileImage;
				}

				return ctx.db.coachProfile.create({
					data: createData,
				});
			}

			const updateData: any = {
				displayUsername: dataToSave.displayUsername,
				bio: dataToSave.bio,
				experience: dataToSave.experience,
				specialties: dataToSave.specialties,
				teachingStyles: dataToSave.teachingStyles,
				headerImage: dataToSave.headerImage,
				rate: dataToSave.rate,
				profileImageType: dataToSave.profileImageType,
			};

			if (dataToSave.profileImage !== undefined) {
				updateData.profileImage = dataToSave.profileImage;
			}

			return ctx.db.coachProfile.update({
				where: { userId: user.userId },
				data: updateData,
			});
		}),

	// Get coach dashboard metrics
	getCoachDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
		// Get the current user
		const user = await getCurrentUser(ctx);

		// Check if user has coaching privileges (COACH or ADMIN only)
		if (user.userType !== UserType.COACH && user.userType !== UserType.ADMIN) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Only coaches and admins can access dashboard metrics.",
			});
		}

		try {
			// Calculate unique students with media accessible to coach
			// This includes all students who have uploaded media (not soft-deleted)
			const studentCount = await ctx.db.user.count({
				where: {
					userType: UserType.STUDENT,
					videoCollections: {
						some: {
							isDeleted: false,
							...(user.userType === UserType.COACH
								? { assignedCoachId: user.userId }
								: {}),
							media: {
								some: {
									isDeleted: false,
								},
							},
						},
					},
				},
			});

			// Calculate weekly coaching notes count (current week Monday-Sunday)
			const { startOfWeek, endOfWeek } = getCurrentWeekRange();

			const weeklyNotesCount = await ctx.db.mediaCoachNote.count({
				where: {
					coachId: user.userId,
					createdAt: {
						gte: startOfWeek,
						lte: endOfWeek,
					},
				},
			});

			return {
				studentCount,
				weeklyNotesCount,
				weekRange: {
					startOfWeek,
					endOfWeek,
				},
			};
		} catch (error) {
			console.error("Error fetching coach dashboard metrics:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch dashboard metrics. Please try again.",
			});
		}
	}),

	// Switch the current user's active club. Validates the user has a UserClub row for the
	// target club, then updates User.clubShortName + User.userType in-place so all existing
	// authorization logic continues to work without any changes.
	switchClub: protectedProcedure
		.input(
			z.object({
				clubShortName: z
					.string()
					.regex(/^[a-zA-Z0-9-]+$/)
					.min(1)
					.max(50),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await getCurrentUser(ctx);
			const sanitized = input.clubShortName.trim().toLowerCase();

			if (sanitized === user.clubShortName) {
				// Already on this club — no-op
				return { clubShortName: user.clubShortName, userType: user.userType };
			}

			// Find the first facility membership for the user in the target club
			const firstMembership = await ctx.db.userClub.findFirst({
				where: {
					userId: user.userId,
					clubShortName: sanitized,
					facility: { isActive: true },
				},
				orderBy: { facility: { position: "asc" } },
			});

			if (!firstMembership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of this club.",
				});
			}

			const updated = await ctx.db.user.update({
				where: { userId: user.userId },
				data: {
					clubShortName: sanitized,
					userType: firstMembership.role,
					activeFacilityId: firstMembership.facilityId,
				},
				select: { clubShortName: true, userType: true, activeFacilityId: true },
			});

			return updated;
		}),

	// Switch the user's active facility. Looks up the per-facility UserClub row to get
	// the user's role at that facility, then updates User.activeFacilityId, clubShortName, and userType.
	switchFacility: protectedProcedure
		.input(z.object({ facilityId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const user = await getCurrentUser(ctx);

			if (input.facilityId === user.activeFacilityId) {
				return { activeFacilityId: user.activeFacilityId, userType: user.userType };
			}

			// Look up the user's membership row for this specific facility
			const membership = await ctx.db.userClub.findUnique({
				where: {
					userId_facilityId: {
						userId: user.userId,
						facilityId: input.facilityId,
					},
				},
				include: {
					facility: {
						select: { clubShortName: true, isActive: true },
					},
				},
			});

			if (!membership || !membership.facility.isActive) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this facility.",
				});
			}

			// Update all three active fields on User
			const updated = await ctx.db.user.update({
				where: { userId: user.userId },
				data: {
					activeFacilityId: input.facilityId,
					clubShortName: membership.facility.clubShortName,
					userType: membership.role,
				},
				select: { activeFacilityId: true, clubShortName: true, userType: true },
			});

			return updated;
		}),

	// Typeahead search across all clubs — open to any authenticated user.
	// Requires at least 4 characters to prevent full-table scans.
	searchClubs: protectedProcedure
		.input(
			z.object({
				query: z.string().min(4).max(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const normalized = input.query.trim().toLowerCase();

			const clubs = await ctx.db.club.findMany({
				where: {
					OR: [
						{ clubName: { contains: normalized, mode: "insensitive" } },
						{ clubShortName: { contains: normalized, mode: "insensitive" } },
					],
				},
				select: { clubShortName: true, clubName: true },
				orderBy: { clubName: "asc" },
				take: 20,
			});

			return clubs.map((c) => ({
				clubShortName: c.clubShortName,
				clubName: c.clubName,
			}));
		}),

	// Create a UserClub membership row for the calling user, then make it the active club.
	// Idempotent — if already a member, just switches active club.
	joinClub: protectedProcedure
		.input(
			z.object({
				clubShortName: z
					.string()
					.regex(/^[a-zA-Z0-9-]+$/)
					.min(1)
					.max(50),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await getCurrentUser(ctx);
			const sanitized = input.clubShortName.trim().toLowerCase();

			// Verify club exists
			const club = await ctx.db.club.findUnique({
				where: { clubShortName: sanitized },
				select: { clubShortName: true, clubName: true },
			});

			if (!club) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Club not found.",
				});
			}

			// Get all active facilities for this club
			const clubFacilities = await ctx.db.clubFacility.findMany({
				where: { clubShortName: sanitized, isActive: true },
				orderBy: { position: "asc" },
				select: { facilityId: true },
			});

			// Create one membership row per facility (idempotent — skip if already exists)
			for (const f of clubFacilities) {
				await ctx.db.userClub.upsert({
					where: {
						userId_facilityId: {
							userId: user.userId,
							facilityId: f.facilityId,
						},
					},
					create: {
						userId: user.userId,
						clubShortName: sanitized,
						facilityId: f.facilityId,
						role: UserType.STUDENT,
					},
					update: {},
				});
			}

			// Switch active club + set active facility to the first one
			const firstFacilityId = clubFacilities[0]?.facilityId ?? null;
			await ctx.db.user.update({
				where: { userId: user.userId },
				data: {
					clubShortName: sanitized,
					userType: UserType.STUDENT,
					activeFacilityId: firstFacilityId,
				},
			});

			return { clubShortName: sanitized, clubName: club.clubName };
		}),

	// Returns all clubs the current user is a member of (deduplicated from per-facility rows).
	// Used by the navbar club switcher.
	getClubMemberships: protectedProcedure.query(async ({ ctx }) => {
		const user = await getCurrentUser(ctx);

		const memberships = await ctx.db.userClub.findMany({
			where: { userId: user.userId },
			include: {
				club: {
					select: {
						clubShortName: true,
						clubName: true,
					},
				},
			},
			orderBy: { club: { clubName: "asc" } },
		});

		// Deduplicate by clubShortName — take the first row per club
		const seen = new Set<string>();
		const deduped = memberships.filter((m) => {
			if (seen.has(m.clubShortName)) return false;
			seen.add(m.clubShortName);
			return true;
		});

		return deduped.map((m) => ({
			id: m.id,
			clubShortName: m.clubShortName,
			clubName: m.club.clubName,
			role: m.role,
			joinedAt: m.joinedAt,
			isActive: m.clubShortName === user.clubShortName,
		}));
	}),

	// Returns all facility memberships for the user's current club.
	// Used by the calendar facility switcher dropdown.
	getFacilityMemberships: protectedProcedure.query(async ({ ctx }) => {
		const user = await getCurrentUser(ctx);

		const memberships = await ctx.db.userClub.findMany({
			where: {
				userId: user.userId,
				clubShortName: user.clubShortName,
				facility: { isActive: true },
			},
			include: {
				facility: {
					select: {
						facilityId: true,
						name: true,
						address: true,
						position: true,
					},
				},
			},
			orderBy: { facility: { position: "asc" } },
		});

		return memberships.map((m) => ({
			facilityId: m.facility.facilityId,
			facilityName: m.facility.name,
			address: m.facility.address,
			role: m.role,
			isActive: m.facilityId === user.activeFacilityId,
		}));
	}),
});
