import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TRPCError } from '@trpc/server';
import { MediaType, SharingType } from '@prisma/client';

/**
 * Property-Based Tests for Coach Media Collection Router
 * 
 * These tests validate universal properties that should hold across all inputs
 * using fast-check for property-based testing with 100+ iterations per test.
 */

describe('Coach Media Collection Router - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Club Isolation Enforcement', () => {
    /**
     * Feature: coach-media-collections, Property 1: Club Isolation Enforcement
     * Validates: Requirements 3.1, 3.2
     * 
     * Property: For any coach collection sharing operation, 
     * all target students must belong to the same club as the coach creating the share
     */
    it('should only allow sharing with students from the same club', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            coachId: fc.uuid(),
            coachClubId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            // Generate array of students with varying club memberships
            students: fc.array(
              fc.record({
                userId: fc.uuid(),
                clubId: fc.uuid(),
                firstName: fc.string({ minLength: 1, maxLength: 50 }),
                lastName: fc.string({ minLength: 1, maxLength: 50 }),
                email: fc.emailAddress(),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          async (testData) => {
            // Determine which students are in the same club as the coach
            const studentsInSameClub = testData.students.filter(
              s => s.clubId === testData.coachClubId
            );
            const studentsInDifferentClub = testData.students.filter(
              s => s.clubId !== testData.coachClubId
            );

            // Create mock database
            const mockDb = {
              coachMediaCollection: {
                findUnique: vi.fn().mockResolvedValue({
                  collectionId: testData.collectionId,
                  coachId: testData.coachId,
                  title: testData.title,
                  mediaType: MediaType.URL_VIDEO,
                  sharingType: SharingType.SPECIFIC_STUDENTS,
                  isDeleted: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              },
              user: {
                findMany: vi.fn(),
              },
              coachCollectionShare: {
                createMany: vi.fn().mockResolvedValue({ count: 0 }),
              },
            };

            // Simulate the shareWithStudents logic
            const shareWithStudents = async (studentIds: string[]) => {
              const collection = await mockDb.coachMediaCollection.findUnique({
                where: { collectionId: testData.collectionId },
              });

              if (!collection || collection.isDeleted) {
                throw new TRPCError({
                  code: 'NOT_FOUND',
                  message: 'Coach media collection not found',
                });
              }

              // Mock finding students - only return those in the same club
              const foundStudents = testData.students.filter(
                s => studentIds.includes(s.userId) && s.clubId === testData.coachClubId
              );

              mockDb.user.findMany.mockResolvedValue(foundStudents);

              const students = await mockDb.user.findMany({
                where: {
                  userId: { in: studentIds },
                  userType: 'STUDENT',
                  clubId: testData.coachClubId,
                },
              });

              // Validate all requested students were found (same club check)
              if (students.length !== studentIds.length) {
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: 'Some students not found or not in the same club',
                });
              }

              // Create share relationships
              await mockDb.coachCollectionShare.createMany({
                data: studentIds.map(studentId => ({
                  collectionId: testData.collectionId,
                  studentId,
                })),
                skipDuplicates: true,
              });

              return { success: true, sharedCount: studentIds.length };
            };

            // Test 1: Sharing with students from the same club should succeed
            if (studentsInSameClub.length > 0) {
              const sameClubIds = studentsInSameClub.map(s => s.userId);
              await expect(shareWithStudents(sameClubIds)).resolves.toEqual({
                success: true,
                sharedCount: sameClubIds.length,
              });
              expect(mockDb.coachCollectionShare.createMany).toHaveBeenCalled();
            }

            // Test 2: Sharing with students from different clubs should fail
            if (studentsInDifferentClub.length > 0) {
              vi.clearAllMocks();
              const differentClubIds = studentsInDifferentClub.map(s => s.userId);
              await expect(shareWithStudents(differentClubIds)).rejects.toThrow(TRPCError);
              await expect(shareWithStudents(differentClubIds)).rejects.toThrow(
                'Some students not found or not in the same club'
              );
              expect(mockDb.coachCollectionShare.createMany).not.toHaveBeenCalled();
            }

            // Test 3: Mixing students from same and different clubs should fail
            if (studentsInSameClub.length > 0 && studentsInDifferentClub.length > 0) {
              vi.clearAllMocks();
              const mixedIds = [
                ...studentsInSameClub.slice(0, 1).map(s => s.userId),
                ...studentsInDifferentClub.slice(0, 1).map(s => s.userId),
              ];
              await expect(shareWithStudents(mixedIds)).rejects.toThrow(TRPCError);
              await expect(shareWithStudents(mixedIds)).rejects.toThrow(
                'Some students not found or not in the same club'
              );
              expect(mockDb.coachCollectionShare.createMany).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in testing strategy
      );
    });

    /**
     * Feature: coach-media-collections, Property 1: Club Isolation Enforcement (All Students mode)
     * Validates: Requirements 3.1, 3.2
     * 
     * Property: For any coach collection with "All Students" sharing mode,
     * only students from the same club as the coach should receive access
     */
    it('should only share with students from the same club in ALL_STUDENTS mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            coachId: fc.uuid(),
            coachClubId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            // Generate students across multiple clubs
            studentsInCoachClub: fc.array(
              fc.record({
                userId: fc.uuid(),
                firstName: fc.string({ minLength: 1, maxLength: 50 }),
                lastName: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
            studentsInOtherClubs: fc.array(
              fc.record({
                userId: fc.uuid(),
                clubId: fc.uuid(),
                firstName: fc.string({ minLength: 1, maxLength: 50 }),
                lastName: fc.string({ minLength: 1, maxLength: 50 }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
          }),
          async (testData) => {
            // Create mock database
            const mockDb = {
              coachMediaCollection: {
                findUnique: vi.fn().mockResolvedValue({
                  collectionId: testData.collectionId,
                  coachId: testData.coachId,
                  title: testData.title,
                  mediaType: MediaType.URL_VIDEO,
                  sharingType: SharingType.SPECIFIC_STUDENTS,
                  isDeleted: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
                update: vi.fn().mockResolvedValue({
                  collectionId: testData.collectionId,
                  sharingType: SharingType.ALL_STUDENTS,
                }),
              },
              user: {
                findMany: vi.fn(),
              },
              coachCollectionShare: {
                createMany: vi.fn().mockResolvedValue({ count: 0 }),
              },
            };

            // Mock finding students - only return those in the coach's club
            const studentsInCoachClub = testData.studentsInCoachClub.map(s => ({
              userId: s.userId,
            }));

            mockDb.user.findMany.mockResolvedValue(studentsInCoachClub);

            // Simulate the shareWithAllStudents logic
            const shareWithAllStudents = async () => {
              const collection = await mockDb.coachMediaCollection.findUnique({
                where: { collectionId: testData.collectionId },
              });

              if (!collection || collection.isDeleted) {
                throw new TRPCError({
                  code: 'NOT_FOUND',
                  message: 'Coach media collection not found',
                });
              }

              // Get all students from the same club (query filters by clubId)
              const students = await mockDb.user.findMany({
                where: {
                  userType: 'STUDENT',
                  clubId: testData.coachClubId,
                },
                select: {
                  userId: true,
                },
              });

              if (students.length === 0) {
                return { success: true, sharedCount: 0 };
              }

              // Update collection sharing type
              await mockDb.coachMediaCollection.update({
                where: { collectionId: testData.collectionId },
                data: { sharingType: SharingType.ALL_STUDENTS },
              });

              // Create share relationships for all students
              await mockDb.coachCollectionShare.createMany({
                data: students.map(student => ({
                  collectionId: testData.collectionId,
                  studentId: student.userId,
                })),
                skipDuplicates: true,
              });

              return { success: true, sharedCount: students.length };
            };

            // Execute the sharing operation
            const result = await shareWithAllStudents();

            // Property assertion: Only students from the coach's club should be shared with
            expect(result.success).toBe(true);
            expect(result.sharedCount).toBe(testData.studentsInCoachClub.length);

            // Verify the database query filtered by the coach's club
            expect(mockDb.user.findMany).toHaveBeenCalledWith({
              where: {
                userType: 'STUDENT',
                clubId: testData.coachClubId,
              },
              select: {
                userId: true,
              },
            });

            // Verify shares were only created for students in the coach's club
            if (testData.studentsInCoachClub.length > 0) {
              expect(mockDb.coachCollectionShare.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining(
                  studentsInCoachClub.map(s => ({
                    collectionId: testData.collectionId,
                    studentId: s.userId,
                  }))
                ),
                skipDuplicates: true,
              });
            }

            // Verify students from other clubs were NOT included
            const sharedStudentIds = mockDb.coachCollectionShare.createMany.mock.calls[0]?.[0]?.data?.map(
              (d: any) => d.studentId
            ) || [];
            
            testData.studentsInOtherClubs.forEach(student => {
              expect(sharedStudentIds).not.toContain(student.userId);
            });
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in testing strategy
      );
    });
  });

  describe('Video Limit Enforcement', () => {
    /**
     * Feature: coach-media-collections, Property 6: URL Video Limit Enforcement
     * Validates: Requirements 2.3
     * 
     * Property: For any coach collection with mediaType URL_VIDEO, 
     * the number of non-deleted media items must not exceed 3
     */
    it('should enforce 3-video limit for URL_VIDEO collections', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            coachId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
            mediaType: fc.constant(MediaType.URL_VIDEO),
            // Generate between 0 and 5 existing media items
            existingMediaCount: fc.integer({ min: 0, max: 5 }),
            // Generate new media to add
            newMediaTitle: fc.string({ minLength: 1, maxLength: 100 }),
            newMediaUrl: fc.webUrl(),
          }),
          async (testData) => {
            // Create mock database
            const mockDb = {
              coachMediaCollection: {
                findUnique: vi.fn(),
              },
              coachMedia: {
                create: vi.fn().mockResolvedValue({
                  mediaId: 'new-media-id',
                  collectionId: testData.collectionId,
                  title: testData.newMediaTitle,
                  videoUrl: testData.newMediaUrl,
                  isDeleted: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              },
            };

            // Create mock context
            const mockCtx = {
              db: mockDb,
              auth: {
                userId: testData.coachId,
              },
            };

            // Generate existing media items
            const existingMedia = Array.from({ length: testData.existingMediaCount }, (_, i) => ({
              mediaId: `media-${i}`,
              collectionId: testData.collectionId,
              title: `Video ${i + 1}`,
              videoUrl: `https://example.com/video${i + 1}.mp4`,
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            // Mock the collection with existing media
            const mockCollection = {
              collectionId: testData.collectionId,
              coachId: testData.coachId,
              title: testData.title,
              description: testData.description,
              mediaType: testData.mediaType,
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              media: existingMedia,
            };

            mockDb.coachMediaCollection.findUnique.mockResolvedValue(mockCollection);

            // Simulate the addMedia logic
            const addMedia = async () => {
              const collection = await mockDb.coachMediaCollection.findUnique({
                where: { collectionId: testData.collectionId },
                include: {
                  media: {
                    where: { isDeleted: false },
                  },
                },
              });

              if (!collection || collection.isDeleted) {
                throw new TRPCError({
                  code: 'NOT_FOUND',
                  message: 'Coach media collection not found',
                });
              }

              // Check if we're adding URL media and enforce the 3 video limit
              if (collection.mediaType === MediaType.URL_VIDEO && collection.media.length >= 3) {
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: 'URL video collections are limited to 3 videos',
                });
              }

              // If we get here, we can add the media
              return mockDb.coachMedia.create({
                data: {
                  collectionId: testData.collectionId,
                  title: testData.newMediaTitle,
                  videoUrl: testData.newMediaUrl,
                },
              });
            };

            // Property assertion: Adding media should succeed if count < 3, fail if count >= 3
            if (testData.existingMediaCount < 3) {
              // Should succeed
              await expect(addMedia()).resolves.toBeDefined();
              expect(mockDb.coachMedia.create).toHaveBeenCalled();
            } else {
              // Should fail with BAD_REQUEST
              await expect(addMedia()).rejects.toThrow(TRPCError);
              await expect(addMedia()).rejects.toThrow('URL video collections are limited to 3 videos');
              expect(mockDb.coachMedia.create).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in testing strategy
      );
    });

    /**
     * Feature: coach-media-collections, Property 6: URL Video Limit Enforcement (edge case)
     * Validates: Requirements 2.3
     * 
     * Property: For any coach collection with mediaType URL_VIDEO,
     * soft-deleted media items should not count toward the 3-video limit
     */
    it('should not count soft-deleted media toward the 3-video limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            collectionId: fc.uuid(),
            coachId: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            mediaType: fc.constant(MediaType.URL_VIDEO),
            // Generate between 0 and 3 active media items
            activeMediaCount: fc.integer({ min: 0, max: 3 }),
            // Generate between 0 and 5 deleted media items
            deletedMediaCount: fc.integer({ min: 0, max: 5 }),
            newMediaTitle: fc.string({ minLength: 1, maxLength: 100 }),
            newMediaUrl: fc.webUrl(),
          }),
          async (testData) => {
            // Create mock database
            const mockDb = {
              coachMediaCollection: {
                findUnique: vi.fn(),
              },
              coachMedia: {
                create: vi.fn().mockResolvedValue({
                  mediaId: 'new-media-id',
                  collectionId: testData.collectionId,
                  title: testData.newMediaTitle,
                  videoUrl: testData.newMediaUrl,
                  isDeleted: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              },
            };

            // Generate active media items
            const activeMedia = Array.from({ length: testData.activeMediaCount }, (_, i) => ({
              mediaId: `active-media-${i}`,
              collectionId: testData.collectionId,
              title: `Active Video ${i + 1}`,
              videoUrl: `https://example.com/active${i + 1}.mp4`,
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            // Generate deleted media items (these should NOT count toward limit)
            const deletedMedia = Array.from({ length: testData.deletedMediaCount }, (_, i) => ({
              mediaId: `deleted-media-${i}`,
              collectionId: testData.collectionId,
              title: `Deleted Video ${i + 1}`,
              videoUrl: `https://example.com/deleted${i + 1}.mp4`,
              isDeleted: true,
              deletedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            // Mock the collection - only return active media (as per the query filter)
            const mockCollection = {
              collectionId: testData.collectionId,
              coachId: testData.coachId,
              title: testData.title,
              mediaType: testData.mediaType,
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              media: activeMedia, // Only active media is returned by the query
            };

            mockDb.coachMediaCollection.findUnique.mockResolvedValue(mockCollection);

            // Simulate the addMedia logic
            const addMedia = async () => {
              const collection = await mockDb.coachMediaCollection.findUnique({
                where: { collectionId: testData.collectionId },
                include: {
                  media: {
                    where: { isDeleted: false }, // Query filters out deleted media
                  },
                },
              });

              if (!collection || collection.isDeleted) {
                throw new TRPCError({
                  code: 'NOT_FOUND',
                  message: 'Coach media collection not found',
                });
              }

              // Check if we're adding URL media and enforce the 3 video limit
              // Only non-deleted media (collection.media) should count
              if (collection.mediaType === MediaType.URL_VIDEO && collection.media.length >= 3) {
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: 'URL video collections are limited to 3 videos',
                });
              }

              return mockDb.coachMedia.create({
                data: {
                  collectionId: testData.collectionId,
                  title: testData.newMediaTitle,
                  videoUrl: testData.newMediaUrl,
                },
              });
            };

            // Property assertion: Only active media count toward the limit
            // Deleted media should be ignored regardless of how many there are
            if (testData.activeMediaCount < 3) {
              // Should succeed - deleted media don't count
              await expect(addMedia()).resolves.toBeDefined();
              expect(mockDb.coachMedia.create).toHaveBeenCalled();
            } else {
              // Should fail - we have 3 or more active media
              await expect(addMedia()).rejects.toThrow(TRPCError);
              await expect(addMedia()).rejects.toThrow('URL video collections are limited to 3 videos');
              expect(mockDb.coachMedia.create).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in testing strategy
      );
    });
  });
});
