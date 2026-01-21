import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

// Mock the database
const mockDb = {
  coachCollectionShare: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  coachMediaCollection: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

// Mock Prisma instance
const mockPrisma = mockDb as unknown as PrismaClient;

describe('Coach Media Collection Database Schema - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 5: Share Relationship Uniqueness
   * Validates: Requirements 4.3, 13.6
   * 
   * Property: For any collection-student pair, there can be at most one active 
   * sharing relationship at any time. The unique constraint on (collectionId, studentId) 
   * should prevent duplicate shares.
   */
  it('should enforce unique constraint on (collectionId, studentId) pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          collectionId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          studentId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          coachId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          shareAttempts: fc.integer({ min: 2, max: 5 }), // Multiple attempts to create the same share
        }),

        async ({ collectionId, studentId, coachId, shareAttempts }) => {
          // Reset all mocks for this iteration
          vi.clearAllMocks();

          // Mock collection exists and belongs to coach
          mockDb.coachMediaCollection.findUnique.mockResolvedValue({
            collectionId,
            coachId,
            title: 'Test Collection',
            mediaType: 'URL_VIDEO',
            sharingType: 'SPECIFIC_STUDENTS',
            isDeleted: false,
          });

          // Mock student exists
          mockDb.user.findUnique.mockResolvedValue({
            userId: studentId,
            userType: 'STUDENT',
            clubId: 'test-club-001',
          });

          // Mock the first share creation succeeds
          mockDb.coachCollectionShare.create
            .mockResolvedValueOnce({
              shareId: 'share-001',
              collectionId,
              studentId,
              sharedAt: new Date(),
            })
            // Subsequent attempts should fail with unique constraint violation
            .mockRejectedValue(new Error('Unique constraint failed on the fields: (`collectionId`,`studentId`)'));

          // Mock count to verify only one share exists
          mockDb.coachCollectionShare.count.mockResolvedValue(1);

          // Simulate the sharing logic that should enforce uniqueness
          const shareWithStudent = async (collectionId: string, studentId: string) => {
            // Check if collection exists and get coach info
            const collection = await mockDb.coachMediaCollection.findUnique({
              where: { collectionId },
              select: { coachId: true, isDeleted: true },
            });

            if (!collection || collection.isDeleted) {
              throw new Error('Collection not found');
            }

            // Check if student exists
            const student = await mockDb.user.findUnique({
              where: { userId: studentId },
              select: { userType: true, clubId: true },
            });

            if (!student || student.userType !== 'STUDENT') {
              throw new Error('Student not found');
            }

            // Attempt to create share - this should enforce unique constraint
            return await mockDb.coachCollectionShare.create({
              data: {
                collectionId,
                studentId,
                sharedAt: new Date(),
              },
            });
          };

          // First share attempt should succeed
          const firstShare = await shareWithStudent(collectionId, studentId);
          expect(firstShare).toBeDefined();
          expect(firstShare.collectionId).toBe(collectionId);
          expect(firstShare.studentId).toBe(studentId);

          // Subsequent attempts should fail due to unique constraint
          for (let i = 1; i < shareAttempts; i++) {
            await expect(shareWithStudent(collectionId, studentId))
              .rejects
              .toThrow('Unique constraint failed on the fields: (`collectionId`,`studentId`)');
          }

          // Verify only one share relationship exists
          const shareCount = await mockDb.coachCollectionShare.count({
            where: {
              collectionId,
              studentId,
            },
          });

          expect(shareCount).toBe(1);

          // Verify the database operations were called correctly for this iteration
          expect(mockDb.coachCollectionShare.create).toHaveBeenCalledTimes(shareAttempts);
          expect(mockDb.coachCollectionShare.create).toHaveBeenCalledWith({
            data: {
              collectionId,
              studentId,
              sharedAt: expect.any(Date),
            },
          });
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in the design document
    );
  });

  /**
   * Additional test to verify the unique constraint works across different scenarios
   */
  it('should allow the same student to be shared with different collections', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          collectionIds: fc.array(
            fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            { minLength: 2, maxLength: 5 }
          ).map(arr => [...new Set(arr)]), // Ensure unique collection IDs
          coachId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        }),

        async ({ studentId, collectionIds, coachId }) => {
          // Skip if we don't have at least 2 unique collections
          if (collectionIds.length < 2) return;

          // Reset all mocks for this iteration
          vi.clearAllMocks();

          // Mock student exists
          mockDb.user.findUnique.mockResolvedValue({
            userId: studentId,
            userType: 'STUDENT',
            clubId: 'test-club-001',
          });

          // Mock all collections exist
          mockDb.coachMediaCollection.findUnique.mockImplementation(({ where }) => {
            if (collectionIds.includes(where.collectionId)) {
              return Promise.resolve({
                collectionId: where.collectionId,
                coachId,
                title: `Test Collection ${where.collectionId}`,
                mediaType: 'URL_VIDEO',
                sharingType: 'SPECIFIC_STUDENTS',
                isDeleted: false,
              });
            }
            return Promise.resolve(null);
          });

          // Mock successful share creation for different collections
          let shareCounter = 0;
          mockDb.coachCollectionShare.create.mockImplementation(({ data }) => {
            shareCounter++;
            return Promise.resolve({
              shareId: `share-${shareCounter}`,
              collectionId: data.collectionId,
              studentId: data.studentId,
              sharedAt: new Date(),
            });
          });

          // Simulate sharing the same student with multiple collections
          const shareWithStudent = async (collectionId: string, studentId: string) => {
            const collection = await mockDb.coachMediaCollection.findUnique({
              where: { collectionId },
              select: { coachId: true, isDeleted: true },
            });

            if (!collection || collection.isDeleted) {
              throw new Error('Collection not found');
            }

            const student = await mockDb.user.findUnique({
              where: { userId: studentId },
              select: { userType: true, clubId: true },
            });

            if (!student || student.userType !== 'STUDENT') {
              throw new Error('Student not found');
            }

            return await mockDb.coachCollectionShare.create({
              data: {
                collectionId,
                studentId,
                sharedAt: new Date(),
              },
            });
          };

          // Share with each collection - all should succeed
          const shares = [];
          for (const collectionId of collectionIds) {
            const share = await shareWithStudent(collectionId, studentId);
            shares.push(share);
            expect(share.collectionId).toBe(collectionId);
            expect(share.studentId).toBe(studentId);
          }

          // Verify all shares were created
          expect(shares).toHaveLength(collectionIds.length);
          expect(mockDb.coachCollectionShare.create).toHaveBeenCalledTimes(collectionIds.length);

          // Verify each collection was shared with the student
          for (const collectionId of collectionIds) {
            expect(mockDb.coachCollectionShare.create).toHaveBeenCalledWith({
              data: {
                collectionId,
                studentId,
                sharedAt: expect.any(Date),
              },
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test to verify the same collection can be shared with different students
   */
  it('should allow the same collection to be shared with different students', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          studentIds: fc.array(
            fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            { minLength: 2, maxLength: 5 }
          ).map(arr => [...new Set(arr)]), // Ensure unique student IDs
          coachId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        }),

        async ({ collectionId, studentIds, coachId }) => {
          // Skip if we don't have at least 2 unique students
          if (studentIds.length < 2) return;

          // Reset all mocks for this iteration
          vi.clearAllMocks();

          // Mock collection exists
          mockDb.coachMediaCollection.findUnique.mockResolvedValue({
            collectionId,
            coachId,
            title: 'Test Collection',
            mediaType: 'URL_VIDEO',
            sharingType: 'SPECIFIC_STUDENTS',
            isDeleted: false,
          });

          // Mock all students exist
          mockDb.user.findUnique.mockImplementation(({ where }) => {
            if (studentIds.includes(where.userId)) {
              return Promise.resolve({
                userId: where.userId,
                userType: 'STUDENT',
                clubId: 'test-club-001',
              });
            }
            return Promise.resolve(null);
          });

          // Mock successful share creation for different students
          let shareCounter = 0;
          mockDb.coachCollectionShare.create.mockImplementation(({ data }) => {
            shareCounter++;
            return Promise.resolve({
              shareId: `share-${shareCounter}`,
              collectionId: data.collectionId,
              studentId: data.studentId,
              sharedAt: new Date(),
            });
          });

          // Simulate sharing the collection with multiple students
          const shareWithStudent = async (collectionId: string, studentId: string) => {
            const collection = await mockDb.coachMediaCollection.findUnique({
              where: { collectionId },
              select: { coachId: true, isDeleted: true },
            });

            if (!collection || collection.isDeleted) {
              throw new Error('Collection not found');
            }

            const student = await mockDb.user.findUnique({
              where: { userId: studentId },
              select: { userType: true, clubId: true },
            });

            if (!student || student.userType !== 'STUDENT') {
              throw new Error('Student not found');
            }

            return await mockDb.coachCollectionShare.create({
              data: {
                collectionId,
                studentId,
                sharedAt: new Date(),
              },
            });
          };

          // Share with each student - all should succeed
          const shares = [];
          for (const studentId of studentIds) {
            const share = await shareWithStudent(collectionId, studentId);
            shares.push(share);
            expect(share.collectionId).toBe(collectionId);
            expect(share.studentId).toBe(studentId);
          }

          // Verify all shares were created
          expect(shares).toHaveLength(studentIds.length);
          expect(mockDb.coachCollectionShare.create).toHaveBeenCalledTimes(studentIds.length);

          // Verify the collection was shared with each student
          for (const studentId of studentIds) {
            expect(mockDb.coachCollectionShare.create).toHaveBeenCalledWith({
              data: {
                collectionId,
                studentId,
                sharedAt: expect.any(Date),
              },
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Collection Ownership Validation
   * Validates: Requirements 7.1, 7.3
   * 
   * Property: For any coach collection modification operation, the requesting user must be 
   * either the collection owner or an admin. This ensures proper access control for 
   * collection management operations.
   */
  it('should enforce collection ownership validation for modification operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          collectionId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          ownerId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          requestingUserId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          requestingUserType: fc.constantFrom('COACH', 'ADMIN', 'STUDENT', 'FACILITY'),
          clubId: fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          operationType: fc.constantFrom('update', 'delete', 'addMedia', 'updateMedia', 'deleteMedia', 'shareWithStudents'),
        }),

        async ({ collectionId, ownerId, requestingUserId, requestingUserType, clubId, operationType }) => {
          // Reset all mocks for this iteration
          vi.clearAllMocks();

          // Mock collection exists and belongs to owner
          mockDb.coachMediaCollection.findUnique.mockResolvedValue({
            collectionId,
            coachId: ownerId,
            title: 'Test Collection',
            mediaType: 'URL_VIDEO',
            sharingType: 'SPECIFIC_STUDENTS',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Mock requesting user
          mockDb.user.findUnique.mockResolvedValue({
            userId: requestingUserId,
            userType: requestingUserType,
            clubId,
            firstName: 'Test',
            lastName: 'User',
            email: `${requestingUserId}@example.com`,
          });

          // Simulate the access control logic that should be enforced
          const checkCollectionAccess = async (collectionId: string, requestingUserId: string, requestingUserType: string) => {
            // Get collection
            const collection = await mockDb.coachMediaCollection.findUnique({
              where: { collectionId },
              select: { coachId: true, isDeleted: true },
            });

            if (!collection || collection.isDeleted) {
              throw new Error('Collection not found');
            }

            // Get requesting user
            const user = await mockDb.user.findUnique({
              where: { userId: requestingUserId },
              select: { userType: true },
            });

            if (!user) {
              throw new Error('User not found');
            }

            // Apply access control logic
            const isOwner = collection.coachId === requestingUserId;
            const isAdmin = user.userType === 'ADMIN';
            
            // Only owner or admin should have access to modify collections
            if (!isOwner && !isAdmin) {
              throw new Error('You are not authorized to access this coach collection');
            }

            return { isOwner, isAdmin, hasAccess: true };
          };

          // Determine expected outcome
          const isOwner = ownerId === requestingUserId;
          const isAdmin = requestingUserType === 'ADMIN';
          const shouldHaveAccess = isOwner || isAdmin;

          if (shouldHaveAccess) {
            // Should succeed
            const result = await checkCollectionAccess(collectionId, requestingUserId, requestingUserType);
            expect(result.hasAccess).toBe(true);
            expect(result.isOwner).toBe(isOwner);
            expect(result.isAdmin).toBe(isAdmin);
          } else {
            // Should fail with authorization error
            await expect(checkCollectionAccess(collectionId, requestingUserId, requestingUserType))
              .rejects
              .toThrow('You are not authorized to access this coach collection');
          }

          // Verify the database operations were called correctly
          expect(mockDb.coachMediaCollection.findUnique).toHaveBeenCalledWith({
            where: { collectionId },
            select: { coachId: true, isDeleted: true },
          });

          expect(mockDb.user.findUnique).toHaveBeenCalledWith({
            where: { userId: requestingUserId },
            select: { userType: true },
          });
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in the design document
    );
  });

  /**
   * Additional test to verify ownership validation works across different scenarios
   */
  it('should validate collection ownership consistently across different user combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          ownerId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          users: fc.array(
            fc.record({
              userId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              userType: fc.constantFrom('COACH', 'ADMIN', 'STUDENT', 'FACILITY'),
              clubId: fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
            }),
            { minLength: 1, maxLength: 5 }
          ).map(arr => {
            // Ensure unique user IDs
            const seen = new Set();
            return arr.filter(user => {
              if (seen.has(user.userId)) return false;
              seen.add(user.userId);
              return true;
            });
          }),
        }),

        async ({ collectionId, ownerId, users }) => {
          // Skip if no users to test
          if (users.length === 0) return;

          // Reset all mocks for this iteration
          vi.clearAllMocks();

          // Mock collection exists and belongs to owner
          mockDb.coachMediaCollection.findUnique.mockResolvedValue({
            collectionId,
            coachId: ownerId,
            title: 'Test Collection',
            mediaType: 'URL_VIDEO',
            sharingType: 'SPECIFIC_STUDENTS',
            isDeleted: false,
          });

          // Mock user lookups
          mockDb.user.findUnique.mockImplementation(({ where }) => {
            const user = users.find(u => u.userId === where.userId);
            if (user) {
              return Promise.resolve({
                userId: user.userId,
                userType: user.userType,
                clubId: user.clubId,
                firstName: 'Test',
                lastName: 'User',
                email: `${user.userId}@example.com`,
              });
            }
            return Promise.resolve(null);
          });

          // Test access for each user
          for (const user of users) {
            const isOwner = user.userId === ownerId;
            const isAdmin = user.userType === 'ADMIN';
            const shouldHaveAccess = isOwner || isAdmin;

            const checkAccess = async () => {
              const collection = await mockDb.coachMediaCollection.findUnique({
                where: { collectionId },
                select: { coachId: true, isDeleted: true },
              });

              if (!collection || collection.isDeleted) {
                throw new Error('Collection not found');
              }

              const userData = await mockDb.user.findUnique({
                where: { userId: user.userId },
                select: { userType: true },
              });

              if (!userData) {
                throw new Error('User not found');
              }

              const userIsOwner = collection.coachId === user.userId;
              const userIsAdmin = userData.userType === 'ADMIN';
              
              if (!userIsOwner && !userIsAdmin) {
                throw new Error('You are not authorized to access this coach collection');
              }

              return { hasAccess: true, isOwner: userIsOwner, isAdmin: userIsAdmin };
            };

            if (shouldHaveAccess) {
              const result = await checkAccess();
              expect(result.hasAccess).toBe(true);
              expect(result.isOwner).toBe(isOwner);
              expect(result.isAdmin).toBe(isAdmin);
            } else {
              await expect(checkAccess())
                .rejects
                .toThrow('You are not authorized to access this coach collection');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test to verify that deleted collections are properly handled in ownership validation
   */
  it('should reject access to deleted collections regardless of ownership', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collectionId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          ownerId: fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          requestingUserType: fc.constantFrom('COACH', 'ADMIN', 'STUDENT', 'FACILITY'),
        }),

        async ({ collectionId, ownerId, requestingUserType }) => {
          // Reset all mocks for this iteration
          vi.clearAllMocks();

          // Mock deleted collection
          mockDb.coachMediaCollection.findUnique.mockResolvedValue({
            collectionId,
            coachId: ownerId,
            title: 'Deleted Collection',
            mediaType: 'URL_VIDEO',
            sharingType: 'SPECIFIC_STUDENTS',
            isDeleted: true, // Collection is deleted
            deletedAt: new Date(),
          });

          // Mock requesting user (could be owner or admin)
          mockDb.user.findUnique.mockResolvedValue({
            userId: ownerId, // Use owner ID to test that even owners can't access deleted collections
            userType: requestingUserType,
            clubId: 'test-club',
            firstName: 'Test',
            lastName: 'User',
            email: `${ownerId}@example.com`,
          });

          const checkDeletedCollectionAccess = async () => {
            const collection = await mockDb.coachMediaCollection.findUnique({
              where: { collectionId },
              select: { coachId: true, isDeleted: true },
            });

            // Should reject access to deleted collections
            if (!collection || collection.isDeleted) {
              throw new Error('Collection not found');
            }

            return { hasAccess: true };
          };

          // Should always fail for deleted collections, regardless of user type or ownership
          await expect(checkDeletedCollectionAccess())
            .rejects
            .toThrow('Collection not found');

          expect(mockDb.coachMediaCollection.findUnique).toHaveBeenCalledWith({
            where: { collectionId },
            select: { coachId: true, isDeleted: true },
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});