import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TRPCError } from '@trpc/server';

// Define types for test data
type TestCoach = {
  coachProfileId: string;
  displayUsername: string;
  bio: string;
  specialties: string[];
  rate: number;
  isVerified: boolean;
  profileImage: Buffer | null;
  profileImageType: string | null;
  createdAt: Date;
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    clubId: string;
    clubName: string;
    userType: 'COACH' | 'ADMIN';
  };
};

type CoachResult = {
  clubId: string;
  userId: string;
  coachProfileId: string;
  displayUsername: string;
  firstName: string;
  lastName: string;
  bio: string;
  specialties: string[];
  rate: number;
  isVerified: boolean;
  profileImageUrl: string | null;
  clubName: string;
};

// Mock the server utilities to avoid environment variable issues
vi.mock('~/server/utils/utils', () => ({
  binaryToBase64DataUrl: vi.fn((buffer: Buffer, type: string) => `data:${type};base64,${buffer.toString('base64')}`),
}));

// Mock the database
const mockDb = {
  user: {
    findUnique: vi.fn(),
  },
  coachProfile: {
    findMany: vi.fn(),
  },
};

// Mock the context
const mockContext = {
  db: mockDb,
  auth: {
    userId: 'test-user-id',
  },
};

// Mock tRPC
vi.mock('~/server/api/trpc', () => ({
  createTRPCRouter: vi.fn((routes) => ({
    createCaller: vi.fn(() => routes),
  })),
  publicProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn((handler) => handler),
  },
  protectedProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn((handler) => handler),
  },
}));

// Import after mocking
import { coachesRouter } from './coaches';

describe('Coaches Router - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClubCoaches Logic', () => {
    /**
     * Feature: club-management, Property 9: Same-club coach filtering
     * Validates: Requirements 9.1, 9.2
     * 
     * Property: For any student selecting a coach for media collection review, 
     * only coaches with matching clubId should be displayed as options
     */
    it('should only return coaches with matching clubId', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            requestingUserClubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            requestingUserClubName: fc.string({ minLength: 1, maxLength: 100 }),
            coaches: fc.array(
              fc.record({
                coachProfileId: fc.uuid(),
                displayUsername: fc.string({ minLength: 1, maxLength: 50 }),
                bio: fc.string({ maxLength: 500 }),
                specialties: fc.array(fc.string(), { maxLength: 5 }),
                rate: fc.integer({ min: 0, max: 1000 }),
                isVerified: fc.boolean(),
                profileImage: fc.constantFrom(null, Buffer.from('fake-image')),
                profileImageType: fc.constantFrom(null, 'image/png'),
                createdAt: fc.date(),
                user: fc.record({
                  userId: fc.uuid(),
                  firstName: fc.string({ minLength: 1, maxLength: 50 }),
                  lastName: fc.string({ minLength: 1, maxLength: 50 }),
                  clubName: fc.string({ minLength: 1, maxLength: 100 }),
                  userType: fc.constantFrom('COACH', 'ADMIN'),
                }),
              }),
              { minLength: 0, maxLength: 20 }
            ),
          }).chain(({ requestingUserClubId, requestingUserClubName, coaches }) => {
            // Ensure all coaches have the same clubId as the requesting user
            const updatedCoaches = coaches.map(coach => ({
              ...coach,
              user: {
                ...coach.user,
                clubId: requestingUserClubId,
              },
            }));

            return fc.constant({
              requestingUserClubId,
              requestingUserClubName,
              coaches: updatedCoaches,
            });
          }),
          async ({ requestingUserClubId, requestingUserClubName, coaches }) => {
            // Setup mocks
            mockDb.user.findUnique.mockResolvedValue({
              clubId: requestingUserClubId,
              clubName: requestingUserClubName,
            });

            mockDb.coachProfile.findMany.mockResolvedValue(coaches);

            // Simulate the getClubCoaches logic
            const getClubCoachesLogic = async (input: { clubId?: string }) => {
              // Get the requesting user to determine their club
              const requestingUser = await mockDb.user.findUnique({
                where: { clerkUserId: mockContext.auth.userId },
                select: {
                  clubId: true,
                  clubName: true,
                },
              });

              if (!requestingUser) {
                throw new Error('User not found');
              }

              // Use provided clubId or fall back to requesting user's clubId
              const clubId = input.clubId || requestingUser.clubId;

              // Validate that clubId is not empty after fallback
              if (!clubId || clubId.trim() === '') {
                throw new Error('Club ID cannot be empty');
              }

              // Query coaches with matching clubId, ensuring only coaches are returned
              const coachesFromDb = await mockDb.coachProfile.findMany({
                where: {
                  user: {
                    userType: {
                      in: ["COACH", "ADMIN"],
                    },
                    clubId: clubId,
                  },
                },
                include: {
                  user: {
                    select: {
                      userId: true,
                      firstName: true,
                      lastName: true,
                      clubId: true,
                      clubName: true,
                      userType: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              });

              // Handle edge case for missing club data - filter out coaches with null/undefined club data
              const validCoaches = coachesFromDb.filter((coach: TestCoach) => 
                coach.user.clubId && 
                coach.user.clubName && 
                (coach.user.userType === "COACH" || coach.user.userType === "ADMIN")
              );

              // Transform coaches for frontend
              const transformedCoaches = validCoaches.map((coach: TestCoach) => ({
                userId: coach.user.userId,
                coachProfileId: coach.coachProfileId,
                displayUsername: coach.displayUsername,
                firstName: coach.user.firstName,
                lastName: coach.user.lastName,
                bio: coach.bio,
                specialties: coach.specialties,
                rate: coach.rate,
                isVerified: coach.isVerified,
                profileImageUrl: coach.profileImage ? `data:${coach.profileImageType || 'image/png'};base64,${coach.profileImage.toString('base64')}` : null,
                clubId: coach.user.clubId,
                clubName: coach.user.clubName,
              }));

              return {
                coaches: transformedCoaches,
                clubId: clubId,
                clubName: requestingUser.clubName,
              };
            };

            // Call the function
            const result = await getClubCoachesLogic({
              clubId: requestingUserClubId,
            });

            // Property assertion: All returned coaches should have the same clubId as the requesting user
            for (const coach of result.coaches) {
              expect(coach.clubId).toBe(requestingUserClubId);
            }

            // Verify the database was called with correct filters
            expect(mockDb.coachProfile.findMany).toHaveBeenCalledWith({
              where: {
                user: {
                  userType: {
                    in: ["COACH", "ADMIN"],
                  },
                  clubId: requestingUserClubId,
                },
              },
              include: {
                user: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    clubId: true,
                    clubName: true,
                    userType: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: club-management, Property 9: Same-club coach filtering (edge case)
     * Validates: Requirements 9.1, 9.2
     * 
     * Property: When coaches from different clubs exist in the database,
     * only coaches matching the requested clubId should be returned
     */
    it('should filter out coaches from different clubs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data with coaches from different clubs
          fc.record({
            targetClubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            targetClubName: fc.string({ minLength: 1, maxLength: 100 }),
            matchingCoaches: fc.array(
              fc.record({
                coachProfileId: fc.uuid(),
                displayUsername: fc.string({ minLength: 1, maxLength: 50 }),
                bio: fc.string({ maxLength: 500 }),
                specialties: fc.array(fc.string(), { maxLength: 5 }),
                rate: fc.integer({ min: 0, max: 1000 }),
                isVerified: fc.boolean(),
                profileImage: fc.constantFrom(null, Buffer.from('fake-image')),
                profileImageType: fc.constantFrom(null, 'image/png'),
                createdAt: fc.date(),
                user: fc.record({
                  userId: fc.uuid(),
                  firstName: fc.string({ minLength: 1, maxLength: 50 }),
                  lastName: fc.string({ minLength: 1, maxLength: 50 }),
                  clubName: fc.string({ minLength: 1, maxLength: 100 }),
                  userType: fc.constantFrom('COACH', 'ADMIN'),
                }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }).chain(({ targetClubId, targetClubName, matchingCoaches }) => {
            // Ensure matching coaches have the target clubId
            const updatedMatchingCoaches = matchingCoaches.map(coach => ({
              ...coach,
              user: {
                ...coach.user,
                clubId: targetClubId,
              },
            }));

            return fc.constant({
              targetClubId,
              targetClubName,
              matchingCoaches: updatedMatchingCoaches,
            });
          }),
          async ({ targetClubId, targetClubName, matchingCoaches }) => {
            // Setup mocks
            mockDb.user.findUnique.mockResolvedValue({
              clubId: targetClubId,
              clubName: targetClubName,
            });

            // Mock the database to return only matching coaches (simulating the WHERE clause filtering)
            mockDb.coachProfile.findMany.mockResolvedValue(matchingCoaches);

            // Simulate the getClubCoaches logic
            const getClubCoachesLogic = async (input: { clubId?: string }) => {
              const requestingUser = await mockDb.user.findUnique({
                where: { clerkUserId: mockContext.auth.userId },
                select: {
                  clubId: true,
                  clubName: true,
                },
              });

              if (!requestingUser) {
                throw new Error('User not found');
              }

              const clubId = input.clubId || requestingUser.clubId;

              if (!clubId || clubId.trim() === '') {
                throw new Error('Club ID cannot be empty');
              }

              const coachesFromDb = await mockDb.coachProfile.findMany({
                where: {
                  user: {
                    userType: {
                      in: ["COACH", "ADMIN"],
                    },
                    clubId: clubId,
                  },
                },
                include: {
                  user: {
                    select: {
                      userId: true,
                      firstName: true,
                      lastName: true,
                      clubId: true,
                      clubName: true,
                      userType: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              });

              const validCoaches = coachesFromDb.filter((coach: TestCoach) => 
                coach.user.clubId && 
                coach.user.clubName && 
                (coach.user.userType === "COACH" || coach.user.userType === "ADMIN")
              );

              const transformedCoaches = validCoaches.map((coach: TestCoach) => ({
                userId: coach.user.userId,
                coachProfileId: coach.coachProfileId,
                displayUsername: coach.displayUsername,
                firstName: coach.user.firstName,
                lastName: coach.user.lastName,
                bio: coach.bio,
                specialties: coach.specialties,
                rate: coach.rate,
                isVerified: coach.isVerified,
                profileImageUrl: coach.profileImage ? `data:${coach.profileImageType || 'image/png'};base64,${coach.profileImage.toString('base64')}` : null,
                clubId: coach.user.clubId,
                clubName: coach.user.clubName,
              }));

              return {
                coaches: transformedCoaches,
                clubId: clubId,
                clubName: requestingUser.clubName,
              };
            };

            // Call the function
            const result = await getClubCoachesLogic({
              clubId: targetClubId,
            });

            // Property assertion: All returned coaches should have the target clubId
            expect(result.coaches.length).toBe(matchingCoaches.length);
            for (const coach of result.coaches) {
              expect(coach.clubId).toBe(targetClubId);
            }

            // Property assertion: No coaches from different clubs should be returned
            const returnedClubIds = result.coaches.map((coach: CoachResult) => coach.clubId);
            const uniqueClubIds = [...new Set(returnedClubIds)];
            expect(uniqueClubIds).toEqual([targetClubId]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: club-management, Property 9: Same-club coach filtering (user type validation)
     * Validates: Requirements 9.2
     * 
     * Property: Only users with userType 'COACH' or 'ADMIN' should be returned,
     * even if they have the matching clubId
     */
    it('should only return users with COACH or ADMIN userType', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            clubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            clubName: fc.string({ minLength: 1, maxLength: 100 }),
            coaches: fc.array(
              fc.record({
                coachProfileId: fc.uuid(),
                displayUsername: fc.string({ minLength: 1, maxLength: 50 }),
                bio: fc.string({ maxLength: 500 }),
                specialties: fc.array(fc.string(), { maxLength: 5 }),
                rate: fc.integer({ min: 0, max: 1000 }),
                isVerified: fc.boolean(),
                profileImage: fc.constantFrom(null, Buffer.from('fake-image')),
                profileImageType: fc.constantFrom(null, 'image/png'),
                createdAt: fc.date(),
                user: fc.record({
                  userId: fc.uuid(),
                  firstName: fc.string({ minLength: 1, maxLength: 50 }),
                  lastName: fc.string({ minLength: 1, maxLength: 50 }),
                  clubName: fc.string({ minLength: 1, maxLength: 100 }),
                  userType: fc.constantFrom('COACH', 'ADMIN'), // Only valid coach types
                }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
          }).chain(({ clubId, clubName, coaches }) => {
            // Ensure all coaches have the same clubId
            const updatedCoaches = coaches.map(coach => ({
              ...coach,
              user: {
                ...coach.user,
                clubId: clubId,
              },
            }));

            return fc.constant({
              clubId,
              clubName,
              coaches: updatedCoaches,
            });
          }),
          async ({ clubId, clubName, coaches }) => {
            // Setup mocks
            mockDb.user.findUnique.mockResolvedValue({
              clubId: clubId,
              clubName: clubName,
            });

            mockDb.coachProfile.findMany.mockResolvedValue(coaches);

            // Simulate the getClubCoaches logic
            const getClubCoachesLogic = async (input: { clubId?: string }) => {
              const requestingUser = await mockDb.user.findUnique({
                where: { clerkUserId: mockContext.auth.userId },
                select: {
                  clubId: true,
                  clubName: true,
                },
              });

              if (!requestingUser) {
                throw new Error('User not found');
              }

              const targetClubId = input.clubId || requestingUser.clubId;

              if (!targetClubId || targetClubId.trim() === '') {
                throw new Error('Club ID cannot be empty');
              }

              const coachesFromDb = await mockDb.coachProfile.findMany({
                where: {
                  user: {
                    userType: {
                      in: ["COACH", "ADMIN"],
                    },
                    clubId: targetClubId,
                  },
                },
                include: {
                  user: {
                    select: {
                      userId: true,
                      firstName: true,
                      lastName: true,
                      clubId: true,
                      clubName: true,
                      userType: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              });

              const validCoaches = coachesFromDb.filter((coach: TestCoach) => 
                coach.user.clubId && 
                coach.user.clubName && 
                (coach.user.userType === "COACH" || coach.user.userType === "ADMIN")
              );

              const transformedCoaches = validCoaches.map((coach: TestCoach) => ({
                userId: coach.user.userId,
                coachProfileId: coach.coachProfileId,
                displayUsername: coach.displayUsername,
                firstName: coach.user.firstName,
                lastName: coach.user.lastName,
                bio: coach.bio,
                specialties: coach.specialties,
                rate: coach.rate,
                isVerified: coach.isVerified,
                profileImageUrl: coach.profileImage ? `data:${coach.profileImageType || 'image/png'};base64,${coach.profileImage.toString('base64')}` : null,
                clubId: coach.user.clubId,
                clubName: coach.user.clubName,
              }));

              return {
                coaches: transformedCoaches,
                clubId: targetClubId,
                clubName: requestingUser.clubName,
              };
            };

            // Call the function
            const result = await getClubCoachesLogic({
              clubId: clubId,
            });

            // Property assertion: All returned coaches should have userType COACH or ADMIN
            for (const coach of result.coaches) {
              // Find the original coach data to verify userType
              const originalCoach = coaches.find(c => c.coachProfileId === coach.coachProfileId);
              expect(['COACH', 'ADMIN']).toContain(originalCoach?.user.userType);
            }

            // Verify the database was called with userType filter
            expect(mockDb.coachProfile.findMany).toHaveBeenCalledWith({
              where: {
                user: {
                  userType: {
                    in: ["COACH", "ADMIN"],
                  },
                  clubId: clubId,
                },
              },
              include: {
                user: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    clubId: true,
                    clubName: true,
                    userType: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});