import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { binaryToBase64DataUrl } from "~/server/utils/utils";

// Zod schemas for input validation

// Input schema for getting coaches with filters
const getCoachesInputSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  teachingStyles: z.array(z.string()).optional(),
  minRate: z.number().int().min(0).optional(),
  maxRate: z.number().int().min(0).optional(),
  isVerified: z.boolean().optional(),
  sortBy: z.enum(['rate', 'createdAt', 'name']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Input schema for getting a coach by username
const getCoachByUsernameInputSchema = z.object({
  username: z.string(),
});

// Input schema for getting coaches from the same club
const getClubCoachesInputSchema = z.object({
  clubShortName: z.string()
    .regex(/^[a-zA-Z0-9-]+$/, "Club ID must contain only alphanumeric characters and hyphens")
    .min(1, "Club ID must be at least 1 character")
    .max(50, "Club ID must be 50 characters or less")
    .optional(), // Optional - will use requesting user's clubShortName if not provided
});

// Types derived from the schemas
type CoachListItem = {
  coachProfileId: string;
  displayUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  specialties: string[];
  rate: number;
  isVerified: boolean;
  profileImageUrl: string | null;
  clubName: string;
};

type CoachDetail = {
  coachProfileId: string;
  displayUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  experience: string | null;
  specialties: string[];
  teachingStyles: string[];
  rate: number;
  isVerified: boolean;
  headerImage: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  clubName: string;
};

export const coachesRouter = createTRPCRouter({
  // Get coaches with filtering and pagination
  getCoaches: publicProcedure
    .input(getCoachesInputSchema)
    .query(async ({ ctx, input }) => {
      const { 
        page, 
        limit, 
        search, 
        specialties, 
        teachingStyles, 
        minRate, 
        maxRate, 
        isVerified,
        sortBy,
        sortOrder
      } = input;
      
      const skip = (page - 1) * limit;
      
      // Build the where clause based on filters
      const where: any = {
        user: {
          userType: {
            in: ["COACH", "ADMIN"] // Include both COACH and ADMIN users
          },
        }
      };
      
      // Add search filter
      if (search) {
        where.OR = [
          {
            bio: {
              contains: search,
              mode: 'insensitive',
            }
          },
          {
            user: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  }
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  }
                }
              ]
            }
          }
        ];
      }
      
      // Add specialties filter
      if (specialties && specialties.length > 0) {
        where.specialties = {
          hasSome: specialties,
        };
      }
      
      // Add teaching styles filter
      if (teachingStyles && teachingStyles.length > 0) {
        where.teachingStyles = {
          hasSome: teachingStyles,
        };
      }
      
      // Add rate range filter
      if (minRate !== undefined) {
        where.rate = {
          ...where.rate,
          gte: minRate,
        };
      }
      
      if (maxRate !== undefined) {
        where.rate = {
          ...where.rate,
          lte: maxRate,
        };
      }
      
      // Add verification filter
      if (isVerified !== undefined) {
        where.isVerified = isVerified;
      }
      
      // Build the orderBy clause based on sortBy and sortOrder
      const orderBy: any = {};
      
      if (sortBy === 'rate') {
        orderBy.rate = sortOrder;
      } else if (sortBy === 'name') {
        orderBy.user = {
          firstName: sortOrder,
        };
      } else {
        // Default to createdAt. Later do it by most active coaches.
        // we can do it by coaches which reviewed or had the most sessions this past week
        orderBy.createdAt = sortOrder;
      }
      
      // Get total count for pagination
      const totalCount = await ctx.db.coachProfile.count({ where });
      
      // Get coaches
      const coaches = await ctx.db.coachProfile.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              club: {
                select: {
                  clubName: true,
                },
              },
            }
          }
        }
      });
      
      // Transform coaches for frontend
      const transformedCoaches = coaches.map(coach => {
        // Generate profile image URL if available
        let profileImageUrl = null;
        if (coach.profileImage) {
          profileImageUrl = binaryToBase64DataUrl(
            coach.profileImage,
            coach.profileImageType || 'image/png' //update this if other image types supported
          );
        }
        
        return {
          coachProfileId: coach.coachProfileId,
          displayUsername: coach.displayUsername,
          firstName: coach.user.firstName,
          lastName: coach.user.lastName,
          bio: coach.bio,
          specialties: coach.specialties,
          rate: coach.rate,
          isVerified: coach.isVerified,
          profileImageUrl,
          clubName: coach.user.club?.clubName ?? "",
        };
      });
      
      // Calculate pagination info
      const pageCount = Math.ceil(totalCount / limit);
      
      return {
        coaches: transformedCoaches,
        pagination: {
          totalCount,
          pageCount,
          currentPage: page,
          perPage: limit,
        }
      };
    }),
    
  // Get coach by username or ID
  getCoachByUsername: publicProcedure
    .input(getCoachByUsernameInputSchema)
    .query(async ({ ctx, input }) => {
      const { username } = input;
      
      // Try to find by displayUsername first, then by coachProfileId
      const coach = await ctx.db.coachProfile.findFirst({
        where: {
          OR: [
            { displayUsername: username },
            { coachProfileId: username }
          ]
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              club: {
                select: {
                  clubName: true,
                },
              },
            }
          }
        }
      });
      
      if (!coach) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach not found",
        });
      }
      
      // Generate profile image URL if available
      let profileImageUrl = null;
      if (coach.profileImage) {
        profileImageUrl = binaryToBase64DataUrl(
          coach.profileImage,
          coach.profileImageType || 'image/png'
        );
      }
      
      // Transform coach for frontend
      const coachDetail: CoachDetail = {
        coachProfileId: coach.coachProfileId,
        displayUsername: coach.displayUsername,
        firstName: coach.user.firstName,
        lastName: coach.user.lastName,
        bio: coach.bio,
        experience: coach.experience,
        specialties: coach.specialties,
        teachingStyles: coach.teachingStyles,
        rate: coach.rate,
        isVerified: coach.isVerified,
        headerImage: coach.headerImage,
        profileImageUrl,
        createdAt: coach.createdAt.toISOString(),
        clubName: coach.user.club?.clubName ?? "",
      };
      
      return coachDetail;
    }),
    
  // Get coaches from the same club as the requesting user
  getClubCoaches: protectedProcedure
    .input(getClubCoachesInputSchema)
    .query(async ({ ctx, input }) => {
      // Get the requesting user to determine their club
      const requestingUser = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
        select: {
          clubShortName: true,
          club: {
            select: {
              clubName: true,
            },
          },
        },
      });
      
      if (!requestingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      
      // Use provided clubShortName or fall back to requesting user's clubShortName
      const clubShortName = input.clubShortName || requestingUser.clubShortName;
      
      // Validate that clubShortName is not empty after fallback
      if (!clubShortName || clubShortName.trim() === '') {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Club ID cannot be empty",
        });
      }
      
      // Query coaches with matching clubShortName, ensuring only coaches are returned
      const coaches = await ctx.db.coachProfile.findMany({
        where: {
          user: {
            userType: {
              in: ["COACH", "ADMIN"], // Ensure only coaches are returned (filter by user type)
            },
            clubShortName: clubShortName, // Filter by club
          },
        },
        include: {
          user: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              clubShortName: true,
              club: {
                select: {
                  clubName: true,
                },
              },
              userType: true, // Include userType for additional validation
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Handle edge case for missing club data - filter out coaches with null/undefined club data
      const validCoaches = coaches.filter(coach => 
        coach.user.clubShortName && 
        coach.user.club?.clubName && 
        (coach.user.userType === "COACH" || coach.user.userType === "ADMIN")
      );
      
      // Transform coaches for frontend
      const transformedCoaches = validCoaches.map(coach => {
        // Generate profile image URL if available
        let profileImageUrl = null;
        if (coach.profileImage) {
          profileImageUrl = binaryToBase64DataUrl(
            coach.profileImage,
            coach.profileImageType || 'image/png'
          );
        }
        
        return {
          userId: coach.user.userId,
          coachProfileId: coach.coachProfileId,
          displayUsername: coach.displayUsername,
          firstName: coach.user.firstName,
          lastName: coach.user.lastName,
          bio: coach.bio,
          specialties: coach.specialties,
          rate: coach.rate,
          isVerified: coach.isVerified,
          profileImageUrl,
          clubShortName: coach.user.clubShortName,
          clubName: coach.user.club?.clubName ?? "",
        };
      });
      
      return {
        coaches: transformedCoaches,
        clubShortName: clubShortName,
        clubName: requestingUser.club?.clubName ?? "",
      };
    }),
});
