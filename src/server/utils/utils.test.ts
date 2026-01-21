import { describe, it, expect } from 'vitest';
import { UserType } from '@prisma/client';
import type { User } from '@prisma/client';
import * as fc from 'fast-check';
import {
  isAdmin,
  isCoach,
  isCoachOrAdmin,
  isFacility,
  isStudent,
  canCreateCoachCollections,
  areInSameClub,
  validateCoachStudentSharing,
  validateFacilityCoachAccess,
  filterUsersByClubAndRole,
  canAccessCoachCollection,
  canAccessSharedCoachCollection,
} from './utils';

// Mock user factory
const createMockUser = (userType: UserType, clubId: string = 'club-1', userId: string = 'user-1'): User => ({
  userId,
  clerkUserId: `clerk-${userId}`,
  email: `${userId}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  profileImage: null,
  userType,
  timeZone: 'UTC',
  clubId,
  clubName: 'Test Club',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('User Role Helper Functions', () => {
  describe('isAdmin', () => {
    it('should return true for admin users', () => {
      const adminUser = createMockUser(UserType.ADMIN);
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for non-admin users', () => {
      const coachUser = createMockUser(UserType.COACH);
      const studentUser = createMockUser(UserType.STUDENT);
      const facilityUser = createMockUser(UserType.FACILITY);
      
      expect(isAdmin(coachUser)).toBe(false);
      expect(isAdmin(studentUser)).toBe(false);
      expect(isAdmin(facilityUser)).toBe(false);
    });
  });

  describe('isCoach', () => {
    it('should return true for coach users', () => {
      const coachUser = createMockUser(UserType.COACH);
      expect(isCoach(coachUser)).toBe(true);
    });

    it('should return false for non-coach users', () => {
      const adminUser = createMockUser(UserType.ADMIN);
      const studentUser = createMockUser(UserType.STUDENT);
      const facilityUser = createMockUser(UserType.FACILITY);
      
      expect(isCoach(adminUser)).toBe(false);
      expect(isCoach(studentUser)).toBe(false);
      expect(isCoach(facilityUser)).toBe(false);
    });
  });

  describe('isCoachOrAdmin', () => {
    it('should return true for coach and admin users', () => {
      const coachUser = createMockUser(UserType.COACH);
      const adminUser = createMockUser(UserType.ADMIN);
      
      expect(isCoachOrAdmin(coachUser)).toBe(true);
      expect(isCoachOrAdmin(adminUser)).toBe(true);
    });

    it('should return false for student and facility users', () => {
      const studentUser = createMockUser(UserType.STUDENT);
      const facilityUser = createMockUser(UserType.FACILITY);
      
      expect(isCoachOrAdmin(studentUser)).toBe(false);
      expect(isCoachOrAdmin(facilityUser)).toBe(false);
    });
  });

  describe('isFacility', () => {
    it('should return true for facility users', () => {
      const facilityUser = createMockUser(UserType.FACILITY);
      expect(isFacility(facilityUser)).toBe(true);
    });

    it('should return false for non-facility users', () => {
      const adminUser = createMockUser(UserType.ADMIN);
      const coachUser = createMockUser(UserType.COACH);
      const studentUser = createMockUser(UserType.STUDENT);
      
      expect(isFacility(adminUser)).toBe(false);
      expect(isFacility(coachUser)).toBe(false);
      expect(isFacility(studentUser)).toBe(false);
    });
  });

  describe('isStudent', () => {
    it('should return true for student users', () => {
      const studentUser = createMockUser(UserType.STUDENT);
      expect(isStudent(studentUser)).toBe(true);
    });

    it('should return false for non-student users', () => {
      const adminUser = createMockUser(UserType.ADMIN);
      const coachUser = createMockUser(UserType.COACH);
      const facilityUser = createMockUser(UserType.FACILITY);
      
      expect(isStudent(adminUser)).toBe(false);
      expect(isStudent(coachUser)).toBe(false);
      expect(isStudent(facilityUser)).toBe(false);
    });
  });
});

describe('Coach Collection Helper Functions', () => {
  describe('canCreateCoachCollections', () => {
    it('should return true for coaches and admins', () => {
      const coachUser = createMockUser(UserType.COACH);
      const adminUser = createMockUser(UserType.ADMIN);
      
      expect(canCreateCoachCollections(coachUser)).toBe(true);
      expect(canCreateCoachCollections(adminUser)).toBe(true);
    });

    it('should return false for students and facility users', () => {
      const studentUser = createMockUser(UserType.STUDENT);
      const facilityUser = createMockUser(UserType.FACILITY);
      
      expect(canCreateCoachCollections(studentUser)).toBe(false);
      expect(canCreateCoachCollections(facilityUser)).toBe(false);
    });
  });

  describe('areInSameClub', () => {
    it('should return true for users in the same club', () => {
      const user1 = createMockUser(UserType.COACH, 'club-1', 'user-1');
      const user2 = createMockUser(UserType.STUDENT, 'club-1', 'user-2');
      
      expect(areInSameClub(user1, user2)).toBe(true);
    });

    it('should return false for users in different clubs', () => {
      const user1 = createMockUser(UserType.COACH, 'club-1', 'user-1');
      const user2 = createMockUser(UserType.STUDENT, 'club-2', 'user-2');
      
      expect(areInSameClub(user1, user2)).toBe(false);
    });
  });

  describe('validateCoachStudentSharing', () => {
    it('should return true for valid coach-student sharing in same club', () => {
      const coach = createMockUser(UserType.COACH, 'club-1', 'coach-1');
      const student = createMockUser(UserType.STUDENT, 'club-1', 'student-1');
      
      expect(validateCoachStudentSharing(coach, student)).toBe(true);
    });

    it('should throw error for non-coach trying to share', () => {
      const student1 = createMockUser(UserType.STUDENT, 'club-1', 'student-1');
      const student2 = createMockUser(UserType.STUDENT, 'club-1', 'student-2');
      
      expect(() => validateCoachStudentSharing(student1, student2)).toThrow('Only coaches and admins can share collections');
    });

    it('should throw error for sharing with non-student', () => {
      const coach = createMockUser(UserType.COACH, 'club-1', 'coach-1');
      const facility = createMockUser(UserType.FACILITY, 'club-1', 'facility-1');
      
      expect(() => validateCoachStudentSharing(coach, facility)).toThrow('Collections can only be shared with students');
    });

    it('should throw error for different clubs', () => {
      const coach = createMockUser(UserType.COACH, 'club-1', 'coach-1');
      const student = createMockUser(UserType.STUDENT, 'club-2', 'student-1');
      
      expect(() => validateCoachStudentSharing(coach, student)).toThrow('Collections can only be shared with students from the same club');
    });
  });

  describe('filterUsersByClubAndRole', () => {
    it('should filter users by club and role', () => {
      const users = [
        createMockUser(UserType.STUDENT, 'club-1', 'student-1'),
        createMockUser(UserType.STUDENT, 'club-2', 'student-2'),
        createMockUser(UserType.COACH, 'club-1', 'coach-1'),
        createMockUser(UserType.STUDENT, 'club-1', 'student-3'),
      ];
      
      const result = filterUsersByClubAndRole(users, 'club-1', UserType.STUDENT);
      
      expect(result).toHaveLength(2);
      expect(result[0]?.userId).toBe('student-1');
      expect(result[1]?.userId).toBe('student-3');
    });

    it('should filter by club only when no role specified', () => {
      const users = [
        createMockUser(UserType.STUDENT, 'club-1', 'student-1'),
        createMockUser(UserType.STUDENT, 'club-2', 'student-2'),
        createMockUser(UserType.COACH, 'club-1', 'coach-1'),
      ];
      
      const result = filterUsersByClubAndRole(users, 'club-1');
      
      expect(result).toHaveLength(2);
      expect(result.some(u => u.userId === 'student-1')).toBe(true);
      expect(result.some(u => u.userId === 'coach-1')).toBe(true);
    });
  });

  describe('canAccessCoachCollection', () => {
    it('should allow collection owner access', () => {
      const coach = createMockUser(UserType.COACH, 'club-1', 'coach-1');
      const collection = { coachId: 'coach-1' };
      
      expect(canAccessCoachCollection(coach, collection)).toBe(true);
    });

    it('should allow admin access', () => {
      const admin = createMockUser(UserType.ADMIN, 'club-1', 'admin-1');
      const collection = { coachId: 'coach-1' };
      
      expect(canAccessCoachCollection(admin, collection)).toBe(true);
    });

    it('should allow facility user access', () => {
      const facility = createMockUser(UserType.FACILITY, 'club-1', 'facility-1');
      const collection = { coachId: 'coach-1' };
      
      expect(canAccessCoachCollection(facility, collection)).toBe(true);
    });

    it('should deny student access', () => {
      const student = createMockUser(UserType.STUDENT, 'club-1', 'student-1');
      const collection = { coachId: 'coach-1' };
      
      expect(canAccessCoachCollection(student, collection)).toBe(false);
    });
  });

  describe('canAccessSharedCoachCollection', () => {
    it('should allow student access when collection is shared', () => {
      const student = createMockUser(UserType.STUDENT, 'club-1', 'student-1');
      const collection = { coachId: 'coach-1' };
      
      expect(canAccessSharedCoachCollection(student, collection, true)).toBe(true);
    });

    it('should deny student access when collection is not shared', () => {
      const student = createMockUser(UserType.STUDENT, 'club-1', 'student-1');
      const collection = { coachId: 'coach-1' };
      
      expect(canAccessSharedCoachCollection(student, collection, false)).toBe(false);
    });

    it('should allow coach access to their own collection regardless of sharing', () => {
      const coach = createMockUser(UserType.COACH, 'club-1', 'coach-1');
      const collection = { coachId: 'coach-1' };
      
      expect(canAccessSharedCoachCollection(coach, collection, false)).toBe(true);
    });
  });
});

describe('Property-Based Tests', () => {
  describe('Property 7: Coach Permission Validation', () => {
    /**
     * **Feature: coach-media-collections, Property 7: Coach Permission Validation**
     * **Validates: Requirements 1.4, 15.2**
     * 
     * For any coach collection creation or modification, the requesting user must have userType COACH or ADMIN
     */
    it('should only allow COACH or ADMIN users to create/modify coach collections', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary user types
          fc.constantFrom(...Object.values(UserType)),
          fc.string({ minLength: 1, maxLength: 50 }), // clubId
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          (userType, clubId, userId) => {
            const user = createMockUser(userType, clubId, userId);
            
            // The property: canCreateCoachCollections should return true if and only if
            // the user has COACH or ADMIN userType
            const canCreate = canCreateCoachCollections(user);
            const shouldBeAllowed = userType === UserType.COACH || userType === UserType.ADMIN;
            
            expect(canCreate).toBe(shouldBeAllowed);
            
            // Also test the underlying isCoachOrAdmin function
            const isCoachOrAdminResult = isCoachOrAdmin(user);
            expect(isCoachOrAdminResult).toBe(shouldBeAllowed);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate coach permissions consistently across different user scenarios', () => {
      fc.assert(
        fc.property(
          // Generate arrays of users with different types
          fc.array(
            fc.record({
              userType: fc.constantFrom(...Object.values(UserType)),
              clubId: fc.string({ minLength: 1, maxLength: 20 }),
              userId: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (userConfigs) => {
            const users = userConfigs.map(config => 
              createMockUser(config.userType, config.clubId, config.userId)
            );
            
            // For each user, verify that permission functions are consistent
            users.forEach(user => {
              const canCreate = canCreateCoachCollections(user);
              const isCoachOrAdminResult = isCoachOrAdmin(user);
              const isCoachResult = isCoach(user);
              const isAdminResult = isAdmin(user);
              
              // These should all be consistent
              expect(canCreate).toBe(isCoachOrAdminResult);
              expect(isCoachOrAdminResult).toBe(isCoachResult || isAdminResult);
              
              // Verify exclusive user types
              const userTypeCount = [isCoachResult, isAdminResult, isStudent(user), isFacility(user)]
                .filter(Boolean).length;
              expect(userTypeCount).toBe(1); // Each user should have exactly one type
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});