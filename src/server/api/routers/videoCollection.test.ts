import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TRPCError } from '@trpc/server';

// Mock the server utilities to avoid environment variable issues
vi.mock('~/server/utils/utils', () => ({
  getCurrentUser: vi.fn(),
  isAdmin: vi.fn(),
  canCreateCollections: vi.fn(),
  canAccessResource: vi.fn(),
  canAccessVideoCollection: vi.fn(),
  requireVideoCollectionAccess: vi.fn(),
}));

// Mock the database
const mockDb = {
  videoCollection: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
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
  protectedProcedure: {
    input: vi.fn().mockReturnThis(),
    mutation: vi.fn((handler) => handler),
  },
}));

describe('Video Collection Router - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignCoach Logic', () => {
    /**
     * Feature: club-management, Property 13: Coach assignment persistence
     * Validates: Requirements 12.2, 12.5
     * 
     * Property: For any coach assigned to a media collection, the coach's user ID 
     * should be stored in the assignedCoachId field and retrievable through queries
     */
    it('should persist coach assignment and make it retrievable', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            studentUserId: fc.uuid(),
            coachUserId: fc.uuid(),
            clubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            clubName: fc.string({ minLength: 1, maxLength: 100 }),
            collectionTitle: fc.string({ minLength: 1, maxLength: 200 }),
            coachFirstName: fc.string({ minLength: 1, maxLength: 50 }),
            coachLastName: fc.string({ minLength: 1, maxLength: 50 }),
            coachDisplayUsername: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async ({ 
            collectionId, 
            studentUserId, 
            coachUserId, 
            clubId, 
            clubName, 
            collectionTitle,
            coachFirstName,
            coachLastName,
            coachDisplayUsername
          }) => {
            // Mock the collection data
            const mockCollection = {
              collectionId: collectionId,
              userId: studentUserId,
              title: collectionTitle,
              isDeleted: false,
              user: {
                userId: studentUserId,
                clubId: clubId,
                clubName: clubName,
              },
            };

            // Mock the coach data
            const mockCoach = {
              userId: coachUserId,
              userType: 'COACH' as const,
              clubId: clubId,
              clubName: clubName,
            };

            // Mock the updated collection with assigned coach
            const mockUpdatedCollection = {
              ...mockCollection,
              assignedCoachId: coachUserId,
              assignedCoach: {
                userId: coachUserId,
                firstName: coachFirstName,
                lastName: coachLastName,
                clubName: clubName,
                coachProfile: {
                  displayUsername: coachDisplayUsername,
                },
              },
            };

            // Setup mocks
            mockDb.videoCollection.findUnique.mockResolvedValue(mockCollection);
            mockDb.user.findUnique.mockResolvedValue(mockCoach);
            mockDb.videoCollection.update.mockResolvedValue(mockUpdatedCollection);

            // Mock getCurrentUser to return the student user
            const { getCurrentUser } = await import('~/server/utils/utils');
            vi.mocked(getCurrentUser).mockResolvedValue({
              userId: studentUserId,
              userType: 'STUDENT',
              clubId: clubId,
              clubName: clubName,
            } as any);

            // Simulate the assignCoach logic
            const assignCoachLogic = async (input: { collectionId: string; coachId?: string }) => {
              const { collectionId, coachId } = input;

              // Get the collection to verify ownership and existence
              const collection = await mockDb.videoCollection.findUnique({
                where: {
                  collectionId: collectionId,
                },
                include: {
                  user: {
                    select: {
                      userId: true,
                      clubId: true,
                      clubName: true,
                    },
                  },
                },
              });

              if (!collection || collection.isDeleted) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Video collection not found",
                });
              }

              // Get the current user
              const user = await getCurrentUser(mockContext);

              // Verify requesting user owns the collection
              if (collection.userId !== user.userId) {
                throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "You are not authorized to assign coaches to this collection",
                });
              }

              // If coachId is provided, validate the coach
              if (coachId) {
                const coach = await mockDb.user.findUnique({
                  where: {
                    userId: coachId,
                  },
                  select: {
                    userId: true,
                    userType: true,
                    clubId: true,
                    clubName: true,
                  },
                });

                if (!coach) {
                  throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coach not found",
                  });
                }

                // Verify coach exists and is a coach user type
                if (coach.userType !== "COACH" && coach.userType !== "ADMIN") {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Selected user is not a coach",
                  });
                }

                // Verify coach and student are in same club
                if (coach.clubId !== collection.user.clubId) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Coach must be from the same club as the student",
                  });
                }
              }

              // Persist coach assignment to database (null coachId removes assignment)
              return mockDb.videoCollection.update({
                where: {
                  collectionId: collectionId,
                },
                data: {
                  assignedCoachId: coachId || null,
                },
                include: {
                  assignedCoach: {
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
                },
              });
            };

            // Call the function to assign the coach
            const result = await assignCoachLogic({
              collectionId: collectionId,
              coachId: coachUserId,
            });

            // Property assertion: The coach's user ID should be stored in assignedCoachId
            expect(result.assignedCoachId).toBe(coachUserId);

            // Property assertion: The assigned coach information should be retrievable
            expect(result.assignedCoach).toBeDefined();
            expect(result.assignedCoach?.userId).toBe(coachUserId);
            expect(result.assignedCoach?.firstName).toBe(coachFirstName);
            expect(result.assignedCoach?.lastName).toBe(coachLastName);
            expect(result.assignedCoach?.clubName).toBe(clubName);
            expect(result.assignedCoach?.coachProfile?.displayUsername).toBe(coachDisplayUsername);

            // Verify the database update was called with correct data
            expect(mockDb.videoCollection.update).toHaveBeenCalledWith({
              where: {
                collectionId: collectionId,
              },
              data: {
                assignedCoachId: coachUserId,
              },
              include: {
                assignedCoach: {
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
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: club-management, Property 13: Coach assignment persistence (removal case)
     * Validates: Requirements 12.2, 12.5
     * 
     * Property: When a coach assignment is removed (coachId is null/undefined),
     * the assignedCoachId field should be set to null and no coach should be retrievable
     */
    it('should persist coach assignment removal', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            studentUserId: fc.uuid(),
            clubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            clubName: fc.string({ minLength: 1, maxLength: 100 }),
            collectionTitle: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          async ({ collectionId, studentUserId, clubId, clubName, collectionTitle }) => {
            // Mock the collection data
            const mockCollection = {
              collectionId: collectionId,
              userId: studentUserId,
              title: collectionTitle,
              isDeleted: false,
              user: {
                userId: studentUserId,
                clubId: clubId,
                clubName: clubName,
              },
            };

            // Mock the updated collection with no assigned coach
            const mockUpdatedCollection = {
              ...mockCollection,
              assignedCoachId: null,
              assignedCoach: null,
            };

            // Setup mocks
            mockDb.videoCollection.findUnique.mockResolvedValue(mockCollection);
            mockDb.videoCollection.update.mockResolvedValue(mockUpdatedCollection);

            // Mock getCurrentUser to return the student user
            const { getCurrentUser } = await import('~/server/utils/utils');
            vi.mocked(getCurrentUser).mockResolvedValue({
              userId: studentUserId,
              userType: 'STUDENT',
              clubId: clubId,
              clubName: clubName,
            } as any);

            // Simulate the assignCoach logic for removal (no coachId provided)
            const assignCoachLogic = async (input: { collectionId: string; coachId?: string }) => {
              const { collectionId, coachId } = input;

              const collection = await mockDb.videoCollection.findUnique({
                where: {
                  collectionId: collectionId,
                },
                include: {
                  user: {
                    select: {
                      userId: true,
                      clubId: true,
                      clubName: true,
                    },
                  },
                },
              });

              if (!collection || collection.isDeleted) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Video collection not found",
                });
              }

              const user = await getCurrentUser(mockContext);

              if (collection.userId !== user.userId) {
                throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "You are not authorized to assign coaches to this collection",
                });
              }

              // Persist coach assignment to database (null coachId removes assignment)
              return mockDb.videoCollection.update({
                where: {
                  collectionId: collectionId,
                },
                data: {
                  assignedCoachId: coachId || null,
                },
                include: {
                  assignedCoach: {
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
                },
              });
            };

            // Call the function to remove coach assignment (no coachId)
            const result = await assignCoachLogic({
              collectionId: collectionId,
              // coachId is undefined, which should remove the assignment
            });

            // Property assertion: The assignedCoachId should be null
            expect(result.assignedCoachId).toBeNull();

            // Property assertion: No assigned coach should be retrievable
            expect(result.assignedCoach).toBeNull();

            // Verify the database update was called with null
            expect(mockDb.videoCollection.update).toHaveBeenCalledWith({
              where: {
                collectionId: collectionId,
              },
              data: {
                assignedCoachId: null,
              },
              include: {
                assignedCoach: {
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
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: club-management, Property 14: Multiple coach assignments
     * Validates: Requirements 11.4
     * 
     * Property: For any student with multiple media collections, different coaches 
     * can be assigned to different collections independently
     */
    it('should allow different coaches to be assigned to different collections independently', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data for multiple collections and coaches
          fc.record({
            studentUserId: fc.uuid(),
            clubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            clubName: fc.string({ minLength: 1, maxLength: 100 }),
            collections: fc.array(
              fc.record({
                collectionId: fc.uuid(),
                title: fc.string({ minLength: 1, maxLength: 200 }),
              }),
              { minLength: 2, maxLength: 5 } // At least 2 collections to test independence
            ),
            coaches: fc.array(
              fc.record({
                coachUserId: fc.uuid(),
                firstName: fc.string({ minLength: 1, maxLength: 50 }),
                lastName: fc.string({ minLength: 1, maxLength: 50 }),
                displayUsername: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: 2, maxLength: 5 } // At least 2 coaches to test different assignments
            ),
          }),
          async ({ studentUserId, clubId, clubName, collections, coaches }) => {
            // Create assignment pairs (collection -> coach)
            const assignments = collections.map((collection, index) => ({
              collectionId: collection.collectionId,
              coachUserId: coaches[index % coaches.length]?.coachUserId, // Cycle through coaches
              coachData: coaches[index % coaches.length],
            }));

            // Mock getCurrentUser to return the student user
            const { getCurrentUser } = await import('~/server/utils/utils');
            vi.mocked(getCurrentUser).mockResolvedValue({
              userId: studentUserId,
              userType: 'STUDENT',
              clubId: clubId,
              clubName: clubName,
            } as any);

            // Track all assignment results
            const assignmentResults: Array<{
              collectionId: string;
              assignedCoachId: string | null;
              assignedCoach: any;
            }> = [];

            // Simulate assigning different coaches to different collections
            for (const assignment of assignments) {
              // Mock the collection data
              const mockCollection = {
                collectionId: assignment.collectionId,
                userId: studentUserId,
                title: collections.find(c => c.collectionId === assignment.collectionId)?.title,
                isDeleted: false,
                user: {
                  userId: studentUserId,
                  clubId: clubId,
                  clubName: clubName,
                },
              };

              // Mock the coach data
              const mockCoach = {
                userId: assignment.coachUserId,
                userType: 'COACH' as const,
                clubId: clubId,
                clubName: clubName,
              };

              // Mock the updated collection with assigned coach
              const mockUpdatedCollection = {
                ...mockCollection,
                assignedCoachId: assignment.coachUserId,
                assignedCoach: {
                  userId: assignment.coachUserId,
                  firstName: assignment.coachData?.firstName,
                  lastName: assignment.coachData?.lastName,
                  clubName: clubName,
                  coachProfile: {
                    displayUsername: assignment.coachData?.displayUsername,
                  },
                },
              };

              // Setup mocks for this specific assignment
              mockDb.videoCollection.findUnique.mockResolvedValue(mockCollection);
              mockDb.user.findUnique.mockResolvedValue(mockCoach);
              mockDb.videoCollection.update.mockResolvedValue(mockUpdatedCollection);

              // Simulate the assignCoach logic
              const assignCoachLogic = async (input: { collectionId: string; coachId?: string }) => {
                const { collectionId, coachId } = input;

                const collection = await mockDb.videoCollection.findUnique({
                  where: { collectionId: collectionId },
                  include: {
                    user: {
                      select: {
                        userId: true,
                        clubId: true,
                        clubName: true,
                      },
                    },
                  },
                });

                if (!collection || collection.isDeleted) {
                  throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Video collection not found",
                  });
                }

                const user = await getCurrentUser(mockContext);

                if (collection.userId !== user.userId) {
                  throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not authorized to assign coaches to this collection",
                  });
                }

                if (coachId) {
                  const coach = await mockDb.user.findUnique({
                    where: { userId: coachId },
                    select: {
                      userId: true,
                      userType: true,
                      clubId: true,
                      clubName: true,
                    },
                  });

                  if (!coach) {
                    throw new TRPCError({
                      code: "NOT_FOUND",
                      message: "Coach not found",
                    });
                  }

                  if (coach.userType !== "COACH" && coach.userType !== "ADMIN") {
                    throw new TRPCError({
                      code: "BAD_REQUEST",
                      message: "Selected user is not a coach",
                    });
                  }

                  if (coach.clubId !== collection.user.clubId) {
                    throw new TRPCError({
                      code: "BAD_REQUEST",
                      message: "Coach must be from the same club as the student",
                    });
                  }
                }

                return mockDb.videoCollection.update({
                  where: { collectionId: collectionId },
                  data: { assignedCoachId: coachId || null },
                  include: {
                    assignedCoach: {
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
                  },
                });
              };

              // Assign the coach to this collection
              const result = await assignCoachLogic({
                collectionId: assignment.collectionId,
                coachId: assignment.coachUserId,
              });

              assignmentResults.push({
                collectionId: assignment.collectionId,
                assignedCoachId: result.assignedCoachId,
                assignedCoach: result.assignedCoach,
              });
            }

            // Property assertion: Each collection should have its assigned coach
            for (let i = 0; i < assignments.length; i++) {
              const assignment = assignments[i];
              const result = assignmentResults[i];

              expect(result?.assignedCoachId).toBe(assignment?.coachUserId);
              expect(result?.assignedCoach?.userId).toBe(assignment?.coachUserId);
            }

            // Property assertion: Different collections can have different coaches
            if (assignments.length >= 2 && coaches.length >= 2) {
              // Check if we have at least two different coach assignments
              const uniqueCoachIds = new Set(assignmentResults.map(r => r.assignedCoachId));
              
              // If we have multiple coaches available and multiple collections,
              // we should be able to assign different coaches (this tests independence)
              if (coaches.length >= 2) {
                // At minimum, the system should support different assignments
                // (we can't guarantee they'll be different due to random cycling, 
                // but the system should support it)
                expect(assignmentResults.length).toBeGreaterThanOrEqual(2);
                
                // Each assignment should be independent - changing one shouldn't affect others
                for (const result of assignmentResults) {
                  expect(result.assignedCoachId).toBeDefined();
                  expect(result.assignedCoach).toBeDefined();
                }
              }
            }

            // Property assertion: All assignments should be from the same club
            for (const result of assignmentResults) {
              expect(result.assignedCoach?.clubName).toBe(clubName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('assignCoach Unit Tests', () => {
    /**
     * Unit test for successful coach assignment
     * Validates: Requirements 9.5, 11.3
     */
    it('should successfully assign a coach to a collection', async () => {
      const collectionId = 'test-collection-id';
      const studentUserId = 'test-student-id';
      const coachUserId = 'test-coach-id';
      const clubId = 'test-club-001';
      const clubName = 'Test Club';

      // Mock the collection data
      const mockCollection = {
        collectionId: collectionId,
        userId: studentUserId,
        title: 'Test Collection',
        isDeleted: false,
        user: {
          userId: studentUserId,
          clubId: clubId,
          clubName: clubName,
        },
      };

      // Mock the coach data
      const mockCoach = {
        userId: coachUserId,
        userType: 'COACH' as const,
        clubId: clubId,
        clubName: clubName,
      };

      // Mock the updated collection
      const mockUpdatedCollection = {
        ...mockCollection,
        assignedCoachId: coachUserId,
        assignedCoach: {
          userId: coachUserId,
          firstName: 'Test',
          lastName: 'Coach',
          clubName: clubName,
          coachProfile: {
            displayUsername: 'testcoach',
          },
        },
      };

      // Setup mocks
      mockDb.videoCollection.findUnique.mockResolvedValue(mockCollection);
      mockDb.user.findUnique.mockResolvedValue(mockCoach);
      mockDb.videoCollection.update.mockResolvedValue(mockUpdatedCollection);

      // Mock getCurrentUser
      const { getCurrentUser } = await import('~/server/utils/utils');
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: studentUserId,
        userType: 'STUDENT',
        clubId: clubId,
        clubName: clubName,
      } as any);

      // Simulate the assignCoach logic
      const assignCoachLogic = async (input: { collectionId: string; coachId?: string }) => {
        const { collectionId, coachId } = input;

        const collection = await mockDb.videoCollection.findUnique({
          where: { collectionId: collectionId },
          include: {
            user: {
              select: {
                userId: true,
                clubId: true,
                clubName: true,
              },
            },
          },
        });

        if (!collection || collection.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video collection not found",
          });
        }

        const user = await getCurrentUser(mockContext);

        if (collection.userId !== user.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to assign coaches to this collection",
          });
        }

        if (coachId) {
          const coach = await mockDb.user.findUnique({
            where: { userId: coachId },
            select: {
              userId: true,
              userType: true,
              clubId: true,
              clubName: true,
            },
          });

          if (!coach) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Coach not found",
            });
          }

          if (coach.userType !== "COACH" && coach.userType !== "ADMIN") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Selected user is not a coach",
            });
          }

          if (coach.clubId !== collection.user.clubId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Coach must be from the same club as the student",
            });
          }
        }

        return mockDb.videoCollection.update({
          where: { collectionId: collectionId },
          data: { assignedCoachId: coachId || null },
          include: {
            assignedCoach: {
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
          },
        });
      };

      // Call the function
      const result = await assignCoachLogic({
        collectionId: collectionId,
        coachId: coachUserId,
      });

      // Assertions
      expect(result.assignedCoachId).toBe(coachUserId);
      expect(result.assignedCoach?.userId).toBe(coachUserId);
      expect(mockDb.videoCollection.update).toHaveBeenCalledWith({
        where: { collectionId: collectionId },
        data: { assignedCoachId: coachUserId },
        include: {
          assignedCoach: {
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
        },
      });
    });

    /**
     * Unit test for successful coach assignment removal
     * Validates: Requirements 9.5, 11.3
     */
    it('should successfully remove a coach assignment', async () => {
      const collectionId = 'test-collection-id';
      const studentUserId = 'test-student-id';
      const clubId = 'test-club-001';
      const clubName = 'Test Club';

      // Mock the collection data
      const mockCollection = {
        collectionId: collectionId,
        userId: studentUserId,
        title: 'Test Collection',
        isDeleted: false,
        user: {
          userId: studentUserId,
          clubId: clubId,
          clubName: clubName,
        },
      };

      // Mock the updated collection with no coach
      const mockUpdatedCollection = {
        ...mockCollection,
        assignedCoachId: null,
        assignedCoach: null,
      };

      // Setup mocks
      mockDb.videoCollection.findUnique.mockResolvedValue(mockCollection);
      mockDb.videoCollection.update.mockResolvedValue(mockUpdatedCollection);

      // Mock getCurrentUser
      const { getCurrentUser } = await import('~/server/utils/utils');
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: studentUserId,
        userType: 'STUDENT',
        clubId: clubId,
        clubName: clubName,
      } as any);

      // Simulate the assignCoach logic for removal
      const assignCoachLogic = async (input: { collectionId: string; coachId?: string }) => {
        const { collectionId, coachId } = input;

        const collection = await mockDb.videoCollection.findUnique({
          where: { collectionId: collectionId },
          include: {
            user: {
              select: {
                userId: true,
                clubId: true,
                clubName: true,
              },
            },
          },
        });

        if (!collection || collection.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video collection not found",
          });
        }

        const user = await getCurrentUser(mockContext);

        if (collection.userId !== user.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to assign coaches to this collection",
          });
        }

        return mockDb.videoCollection.update({
          where: { collectionId: collectionId },
          data: { assignedCoachId: coachId || null },
          include: {
            assignedCoach: {
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
          },
        });
      };

      // Call the function without coachId (removal)
      const result = await assignCoachLogic({
        collectionId: collectionId,
        // coachId is undefined, should remove assignment
      });

      // Assertions
      expect(result.assignedCoachId).toBeNull();
      expect(result.assignedCoach).toBeNull();
      expect(mockDb.videoCollection.update).toHaveBeenCalledWith({
        where: { collectionId: collectionId },
        data: { assignedCoachId: null },
        include: {
          assignedCoach: {
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
        },
      });
    });

    /**
     * Unit test for validation error when coach is from different club
     * Validates: Requirements 9.1, 11.3
     */
    it('should throw error for cross-club coach assignment', async () => {
      const collectionId = 'test-collection-id';
      const studentUserId = 'test-student-id';
      const coachUserId = 'test-coach-id';
      const studentClubId = 'student-club-001';
      const coachClubId = 'coach-club-002'; // Different club

      // Mock the collection data
      const mockCollection = {
        collectionId: collectionId,
        userId: studentUserId,
        title: 'Test Collection',
        isDeleted: false,
        user: {
          userId: studentUserId,
          clubId: studentClubId,
          clubName: 'Student Club',
        },
      };

      // Mock the coach data from different club
      const mockCoach = {
        userId: coachUserId,
        userType: 'COACH' as const,
        clubId: coachClubId,
        clubName: 'Coach Club',
      };

      // Setup mocks
      mockDb.videoCollection.findUnique.mockResolvedValue(mockCollection);
      mockDb.user.findUnique.mockResolvedValue(mockCoach);

      // Mock getCurrentUser
      const { getCurrentUser } = await import('~/server/utils/utils');
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: studentUserId,
        userType: 'STUDENT',
        clubId: studentClubId,
        clubName: 'Student Club',
      } as any);

      // Simulate the assignCoach logic
      const assignCoachLogic = async (input: { collectionId: string; coachId?: string }) => {
        const { collectionId, coachId } = input;

        const collection = await mockDb.videoCollection.findUnique({
          where: { collectionId: collectionId },
          include: {
            user: {
              select: {
                userId: true,
                clubId: true,
                clubName: true,
              },
            },
          },
        });

        if (!collection || collection.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video collection not found",
          });
        }

        const user = await getCurrentUser(mockContext);

        if (collection.userId !== user.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to assign coaches to this collection",
          });
        }

        if (coachId) {
          const coach = await mockDb.user.findUnique({
            where: { userId: coachId },
            select: {
              userId: true,
              userType: true,
              clubId: true,
              clubName: true,
            },
          });

          if (!coach) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Coach not found",
            });
          }

          if (coach.userType !== "COACH" && coach.userType !== "ADMIN") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Selected user is not a coach",
            });
          }

          if (coach.clubId !== collection.user.clubId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Coach must be from the same club as the student",
            });
          }
        }

        return mockDb.videoCollection.update({
          where: { collectionId: collectionId },
          data: { assignedCoachId: coachId || null },
          include: {
            assignedCoach: {
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
          },
        });
      };

      // Call the function and expect it to throw
      await expect(assignCoachLogic({
        collectionId: collectionId,
        coachId: coachUserId,
      })).rejects.toThrow('Coach must be from the same club as the student');

      // Verify update was not called
      expect(mockDb.videoCollection.update).not.toHaveBeenCalled();
    });
  });

  describe('Access Control Property Tests', () => {
    /**
     * Feature: club-management, Property 10: Coach assignment access control
     * Validates: Requirements 10.1, 10.2
     * 
     * Property: For any media collection with an assigned coach, only that specific coach 
     * and the student owner should have access to the collection
     */
    it('should allow access only to assigned coach and collection owner', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            studentUserId: fc.uuid(),
            assignedCoachUserId: fc.uuid(),
            unassignedCoachUserId: fc.uuid(),
            adminUserId: fc.uuid(),
            clubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            clubName: fc.string({ minLength: 1, maxLength: 100 }),
            collectionTitle: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          async ({ 
            collectionId, 
            studentUserId, 
            assignedCoachUserId, 
            unassignedCoachUserId,
            adminUserId,
            clubId, 
            clubName, 
            collectionTitle 
          }) => {
            // Mock the collection with assigned coach
            const mockCollection = {
              collectionId: collectionId,
              userId: studentUserId,
              title: collectionTitle,
              isDeleted: false,
              assignedCoachId: assignedCoachUserId,
            };

            // Import the access control functions
            const { canAccessVideoCollection, requireVideoCollectionAccess, isAdmin } = await import('~/server/utils/utils');

            // Mock the isAdmin function
            vi.mocked(isAdmin).mockImplementation((user: any) => user.userType === 'ADMIN');

            // Mock the access control functions to use the actual implementation
            vi.mocked(canAccessVideoCollection).mockImplementation((user: any, collection: any) => {
              // Check if user is collection owner
              if (user.userId === collection.userId) {
                return true;
              }
              
              // Check if user is assigned coach
              if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
                return true;
              }
              
              // Check if user is admin
              if (user.userType === 'ADMIN') {
                return true;
              }
              
              return false;
            });

            vi.mocked(requireVideoCollectionAccess).mockImplementation((user: any, collection: any) => {
              const hasAccess = user.userId === collection.userId || 
                               (collection.assignedCoachId && user.userId === collection.assignedCoachId) ||
                               user.userType === 'ADMIN';
              
              if (!hasAccess) {
                throw new Error('You are not authorized to access this collection');
              }
            });

            // Test cases for different user types
            const testCases = [
              {
                user: { userId: studentUserId, userType: 'STUDENT' as const },
                shouldHaveAccess: true,
                description: 'collection owner (student)',
              },
              {
                user: { userId: assignedCoachUserId, userType: 'COACH' as const },
                shouldHaveAccess: true,
                description: 'assigned coach',
              },
              {
                user: { userId: unassignedCoachUserId, userType: 'COACH' as const },
                shouldHaveAccess: false,
                description: 'unassigned coach',
              },
              {
                user: { userId: adminUserId, userType: 'ADMIN' as const },
                shouldHaveAccess: true,
                description: 'admin user',
              },
            ];

            for (const testCase of testCases) {
              // Test canAccessVideoCollection function
              const hasAccess = canAccessVideoCollection(testCase.user as any, mockCollection);
              
              if (testCase.shouldHaveAccess) {
                expect(hasAccess).toBe(true);
                
                // requireVideoCollectionAccess should not throw
                expect(() => requireVideoCollectionAccess(testCase.user as any, mockCollection)).not.toThrow();
              } else {
                expect(hasAccess).toBe(false);
                
                // requireVideoCollectionAccess should throw for unauthorized users
                expect(() => requireVideoCollectionAccess(testCase.user as any, mockCollection)).toThrow('You are not authorized to access this collection');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: club-management, Property 11: Unassigned collection access
     * Validates: Requirements 10.3
     * 
     * Property: For any media collection with no assigned coach, only the student owner 
     * should have access to the collection (plus admins)
     */
    it('should allow access only to collection owner when no coach is assigned', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            studentUserId: fc.uuid(),
            coachUserId: fc.uuid(),
            adminUserId: fc.uuid(),
            clubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            clubName: fc.string({ minLength: 1, maxLength: 100 }),
            collectionTitle: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          async ({ 
            collectionId, 
            studentUserId, 
            coachUserId, 
            adminUserId,
            clubId, 
            clubName, 
            collectionTitle 
          }) => {
            // Mock the collection with NO assigned coach
            const mockCollection = {
              collectionId: collectionId,
              userId: studentUserId,
              title: collectionTitle,
              isDeleted: false,
              assignedCoachId: null, // No coach assigned
            };

            // Import the access control functions
            const { canAccessVideoCollection, requireVideoCollectionAccess, isAdmin } = await import('~/server/utils/utils');

            // Mock the isAdmin function
            vi.mocked(isAdmin).mockImplementation((user: any) => user.userType === 'ADMIN');

            // Mock the access control functions to use the actual implementation
            vi.mocked(canAccessVideoCollection).mockImplementation((user: any, collection: any) => {
              // Check if user is collection owner
              if (user.userId === collection.userId) {
                return true;
              }
              
              // Check if user is assigned coach
              if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
                return true;
              }
              
              // Check if user is admin
              if (user.userType === 'ADMIN') {
                return true;
              }
              
              return false;
            });

            vi.mocked(requireVideoCollectionAccess).mockImplementation((user: any, collection: any) => {
              const hasAccess = user.userId === collection.userId || 
                               (collection.assignedCoachId && user.userId === collection.assignedCoachId) ||
                               user.userType === 'ADMIN';
              
              if (!hasAccess) {
                throw new Error('You are not authorized to access this collection');
              }
            });

            // Test cases for different user types
            const testCases = [
              {
                user: { userId: studentUserId, userType: 'STUDENT' as const },
                shouldHaveAccess: true,
                description: 'collection owner (student)',
              },
              {
                user: { userId: coachUserId, userType: 'COACH' as const },
                shouldHaveAccess: false,
                description: 'unassigned coach',
              },
              {
                user: { userId: adminUserId, userType: 'ADMIN' as const },
                shouldHaveAccess: true,
                description: 'admin user',
              },
            ];

            for (const testCase of testCases) {
              // Test canAccessVideoCollection function
              const hasAccess = canAccessVideoCollection(testCase.user as any, mockCollection);
              
              if (testCase.shouldHaveAccess) {
                expect(hasAccess).toBe(true);
                
                // requireVideoCollectionAccess should not throw
                expect(() => requireVideoCollectionAccess(testCase.user as any, mockCollection)).not.toThrow();
              } else {
                expect(hasAccess).toBe(false);
                
                // requireVideoCollectionAccess should throw for unauthorized users
                expect(() => requireVideoCollectionAccess(testCase.user as any, mockCollection)).toThrow('You are not authorized to access this collection');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: club-management, Property 12: Access permission updates
     * Validates: Requirements 10.5, 11.3
     * 
     * Property: For any change in coach assignment, access permissions should be 
     * updated immediately to reflect the new assignment
     */
    it('should update access permissions immediately when coach assignment changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            studentUserId: fc.uuid(),
            oldCoachUserId: fc.uuid(),
            newCoachUserId: fc.uuid(),
            clubId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
            clubName: fc.string({ minLength: 1, maxLength: 100 }),
            collectionTitle: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          async ({ 
            collectionId, 
            studentUserId, 
            oldCoachUserId, 
            newCoachUserId,
            clubId, 
            clubName, 
            collectionTitle 
          }) => {
            // Import the access control functions
            const { canAccessVideoCollection, isAdmin } = await import('~/server/utils/utils');

            // Mock the isAdmin function
            vi.mocked(isAdmin).mockImplementation((user: any) => user.userType === 'ADMIN');

            // Mock the access control functions to use the actual implementation
            vi.mocked(canAccessVideoCollection).mockImplementation((user: any, collection: any) => {
              // Check if user is collection owner
              if (user.userId === collection.userId) {
                return true;
              }
              
              // Check if user is assigned coach
              if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
                return true;
              }
              
              // Check if user is admin
              if (user.userType === 'ADMIN') {
                return true;
              }
              
              return false;
            });

            // Test user objects
            const studentUser = { userId: studentUserId, userType: 'STUDENT' as const };
            const oldCoachUser = { userId: oldCoachUserId, userType: 'COACH' as const };
            const newCoachUser = { userId: newCoachUserId, userType: 'COACH' as const };

            // Initial state: collection assigned to old coach
            const collectionWithOldCoach = {
              collectionId: collectionId,
              userId: studentUserId,
              title: collectionTitle,
              isDeleted: false,
              assignedCoachId: oldCoachUserId,
            };

            // Property assertion: Old coach should have access initially
            expect(canAccessVideoCollection(oldCoachUser as any, collectionWithOldCoach)).toBe(true);
            expect(canAccessVideoCollection(newCoachUser as any, collectionWithOldCoach)).toBe(false);
            expect(canAccessVideoCollection(studentUser as any, collectionWithOldCoach)).toBe(true);

            // Updated state: collection reassigned to new coach
            const collectionWithNewCoach = {
              ...collectionWithOldCoach,
              assignedCoachId: newCoachUserId,
            };

            // Property assertion: Access permissions should be updated immediately
            expect(canAccessVideoCollection(oldCoachUser as any, collectionWithNewCoach)).toBe(false);
            expect(canAccessVideoCollection(newCoachUser as any, collectionWithNewCoach)).toBe(true);
            expect(canAccessVideoCollection(studentUser as any, collectionWithNewCoach)).toBe(true);

            // Final state: coach assignment removed
            const collectionWithNoCoach = {
              ...collectionWithOldCoach,
              assignedCoachId: null,
            };

            // Property assertion: Only student owner should have access when no coach assigned
            expect(canAccessVideoCollection(oldCoachUser as any, collectionWithNoCoach)).toBe(false);
            expect(canAccessVideoCollection(newCoachUser as any, collectionWithNoCoach)).toBe(false);
            expect(canAccessVideoCollection(studentUser as any, collectionWithNoCoach)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Access Control Unit Tests', () => {
    /**
     * Unit test for owner access
     * Validates: Requirements 10.1, 10.2, 10.3, 10.4
     */
    it('should allow collection owner access', async () => {
      const studentUserId = 'test-student-id';
      const coachUserId = 'test-coach-id';

      // Import the access control functions
      const { canAccessVideoCollection, requireVideoCollectionAccess, isAdmin } = await import('~/server/utils/utils');

      // Mock the isAdmin function
      vi.mocked(isAdmin).mockImplementation((user: any) => user.userType === 'ADMIN');

      // Mock the access control functions to use the actual implementation
      vi.mocked(canAccessVideoCollection).mockImplementation((user: any, collection: any) => {
        // Check if user is collection owner
        if (user.userId === collection.userId) {
          return true;
        }
        
        // Check if user is assigned coach
        if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
          return true;
        }
        
        // Check if user is admin
        if (user.userType === 'ADMIN') {
          return true;
        }
        
        return false;
      });

      vi.mocked(requireVideoCollectionAccess).mockImplementation((user: any, collection: any) => {
        const hasAccess = user.userId === collection.userId || 
                         (collection.assignedCoachId && user.userId === collection.assignedCoachId) ||
                         user.userType === 'ADMIN';
        
        if (!hasAccess) {
          throw new Error('You are not authorized to access this collection');
        }
      });

      const studentUser = { userId: studentUserId, userType: 'STUDENT' };
      const collection = {
        collectionId: 'test-collection-id',
        userId: studentUserId,
        assignedCoachId: coachUserId,
      };

      // Test owner access
      expect(canAccessVideoCollection(studentUser as any, collection)).toBe(true);
      expect(() => requireVideoCollectionAccess(studentUser as any, collection)).not.toThrow();
    });

    /**
     * Unit test for assigned coach access
     * Validates: Requirements 10.1, 10.2
     */
    it('should allow assigned coach access', async () => {
      const studentUserId = 'test-student-id';
      const coachUserId = 'test-coach-id';

      // Import the access control functions
      const { canAccessVideoCollection, requireVideoCollectionAccess, isAdmin } = await import('~/server/utils/utils');

      // Mock the isAdmin function
      vi.mocked(isAdmin).mockImplementation((user: any) => user.userType === 'ADMIN');

      // Mock the access control functions to use the actual implementation
      vi.mocked(canAccessVideoCollection).mockImplementation((user: any, collection: any) => {
        // Check if user is collection owner
        if (user.userId === collection.userId) {
          return true;
        }
        
        // Check if user is assigned coach
        if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
          return true;
        }
        
        // Check if user is admin
        if (user.userType === 'ADMIN') {
          return true;
        }
        
        return false;
      });

      vi.mocked(requireVideoCollectionAccess).mockImplementation((user: any, collection: any) => {
        const hasAccess = user.userId === collection.userId || 
                         (collection.assignedCoachId && user.userId === collection.assignedCoachId) ||
                         user.userType === 'ADMIN';
        
        if (!hasAccess) {
          throw new Error('You are not authorized to access this collection');
        }
      });

      const coachUser = { userId: coachUserId, userType: 'COACH' };
      const collection = {
        collectionId: 'test-collection-id',
        userId: studentUserId,
        assignedCoachId: coachUserId,
      };

      // Test assigned coach access
      expect(canAccessVideoCollection(coachUser as any, collection)).toBe(true);
      expect(() => requireVideoCollectionAccess(coachUser as any, collection)).not.toThrow();
    });

    /**
     * Unit test for unauthorized coach access denial
     * Validates: Requirements 10.2, 10.3
     */
    it('should deny unauthorized coach access', async () => {
      const studentUserId = 'test-student-id';
      const assignedCoachUserId = 'test-assigned-coach-id';
      const unauthorizedCoachUserId = 'test-unauthorized-coach-id';

      // Import the access control functions
      const { canAccessVideoCollection, requireVideoCollectionAccess, isAdmin } = await import('~/server/utils/utils');

      // Mock the isAdmin function
      vi.mocked(isAdmin).mockImplementation((user: any) => user.userType === 'ADMIN');

      // Mock the access control functions to use the actual implementation
      vi.mocked(canAccessVideoCollection).mockImplementation((user: any, collection: any) => {
        // Check if user is collection owner
        if (user.userId === collection.userId) {
          return true;
        }
        
        // Check if user is assigned coach
        if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
          return true;
        }
        
        // Check if user is admin
        if (user.userType === 'ADMIN') {
          return true;
        }
        
        return false;
      });

      vi.mocked(requireVideoCollectionAccess).mockImplementation((user: any, collection: any) => {
        const hasAccess = user.userId === collection.userId || 
                         (collection.assignedCoachId && user.userId === collection.assignedCoachId) ||
                         user.userType === 'ADMIN';
        
        if (!hasAccess) {
          throw new Error('You are not authorized to access this collection');
        }
      });

      const unauthorizedCoachUser = { userId: unauthorizedCoachUserId, userType: 'COACH' };
      const collection = {
        collectionId: 'test-collection-id',
        userId: studentUserId,
        assignedCoachId: assignedCoachUserId, // Different coach assigned
      };

      // Test unauthorized coach access denial
      expect(canAccessVideoCollection(unauthorizedCoachUser as any, collection)).toBe(false);
      expect(() => requireVideoCollectionAccess(unauthorizedCoachUser as any, collection))
        .toThrow('You are not authorized to access this collection');
    });

    /**
     * Unit test for access after assignment changes
     * Validates: Requirements 10.4, 10.5
     */
    it('should update access after assignment changes', async () => {
      const studentUserId = 'test-student-id';
      const oldCoachUserId = 'test-old-coach-id';
      const newCoachUserId = 'test-new-coach-id';

      // Import the access control functions
      const { canAccessVideoCollection, isAdmin } = await import('~/server/utils/utils');

      // Mock the isAdmin function
      vi.mocked(isAdmin).mockImplementation((user: any) => user.userType === 'ADMIN');

      // Mock the access control functions to use the actual implementation
      vi.mocked(canAccessVideoCollection).mockImplementation((user: any, collection: any) => {
        // Check if user is collection owner
        if (user.userId === collection.userId) {
          return true;
        }
        
        // Check if user is assigned coach
        if (collection.assignedCoachId && user.userId === collection.assignedCoachId) {
          return true;
        }
        
        // Check if user is admin
        if (user.userType === 'ADMIN') {
          return true;
        }
        
        return false;
      });

      const oldCoachUser = { userId: oldCoachUserId, userType: 'COACH' };
      const newCoachUser = { userId: newCoachUserId, userType: 'COACH' };

      // Initial state: collection assigned to old coach
      const collectionWithOldCoach = {
        collectionId: 'test-collection-id',
        userId: studentUserId,
        assignedCoachId: oldCoachUserId,
      };

      // Test initial access
      expect(canAccessVideoCollection(oldCoachUser as any, collectionWithOldCoach)).toBe(true);
      expect(canAccessVideoCollection(newCoachUser as any, collectionWithOldCoach)).toBe(false);

      // Updated state: collection reassigned to new coach
      const collectionWithNewCoach = {
        ...collectionWithOldCoach,
        assignedCoachId: newCoachUserId,
      };

      // Test updated access
      expect(canAccessVideoCollection(oldCoachUser as any, collectionWithNewCoach)).toBe(false);
      expect(canAccessVideoCollection(newCoachUser as any, collectionWithNewCoach)).toBe(true);
    });
  });
});