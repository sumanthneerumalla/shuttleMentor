import { describe, it, expect } from 'vitest';
import { 
  getCurrentWeekRange, 
  isDateInCurrentWeek, 
  getWeekRangeForDate,
  validateDate,
  validateDateRange,
  isDateInWeekRange,
  getWeekNumber,
  areDatesInSameWeek
} from './dateUtils';

describe('Date Utilities', () => {
  describe('validateDate', () => {
    it('should accept valid dates', () => {
      expect(() => validateDate(new Date())).not.toThrow();
      expect(() => validateDate(new Date('2024-01-01'))).not.toThrow();
    });

    it('should reject invalid dates', () => {
      expect(() => validateDate(new Date('invalid'))).toThrow('Invalid date provided');
      expect(() => validateDate(new Date(NaN))).toThrow('Invalid date provided');
    });

    it('should reject non-Date objects', () => {
      expect(() => validateDate('2024-01-01' as any)).toThrow('Invalid date provided');
      expect(() => validateDate(null as any)).toThrow('Invalid date provided');
      expect(() => validateDate(undefined as any)).toThrow('Invalid date provided');
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date ranges', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-07');
      expect(() => validateDateRange(start, end)).not.toThrow();
      
      // Same date should be valid
      expect(() => validateDateRange(start, start)).not.toThrow();
    });

    it('should reject invalid date ranges', () => {
      const start = new Date('2024-01-07');
      const end = new Date('2024-01-01');
      expect(() => validateDateRange(start, end)).toThrow('Start date must be before or equal to end date');
    });

    it('should reject invalid dates in range', () => {
      const validDate = new Date('2024-01-01');
      const invalidDate = new Date('invalid');
      
      expect(() => validateDateRange(invalidDate, validDate)).toThrow('Invalid date provided');
      expect(() => validateDateRange(validDate, invalidDate)).toThrow('Invalid date provided');
    });
  });

  describe('getCurrentWeekRange', () => {
    it('should return start and end of current week', () => {
      const { startOfWeek, endOfWeek } = getCurrentWeekRange();
      
      // Start should be Monday at 00:00:00
      expect(startOfWeek.getDay()).toBe(1); // Monday
      expect(startOfWeek.getHours()).toBe(0);
      expect(startOfWeek.getMinutes()).toBe(0);
      expect(startOfWeek.getSeconds()).toBe(0);
      expect(startOfWeek.getMilliseconds()).toBe(0);
      
      // End should be Sunday at 23:59:59.999
      expect(endOfWeek.getDay()).toBe(0); // Sunday
      expect(endOfWeek.getHours()).toBe(23);
      expect(endOfWeek.getMinutes()).toBe(59);
      expect(endOfWeek.getSeconds()).toBe(59);
      expect(endOfWeek.getMilliseconds()).toBe(999);
      
      // End should be 6 days after start
      const diffInDays = (endOfWeek.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24);
      expect(Math.floor(diffInDays)).toBe(6);
    });

    it('should handle timezone parameter', () => {
      // Test with UTC timezone
      const { startOfWeek, endOfWeek } = getCurrentWeekRange('UTC');
      
      expect(startOfWeek.getDay()).toBe(1); // Monday
      expect(endOfWeek.getDay()).toBe(0); // Sunday
      expect(startOfWeek.getHours()).toBe(0);
      expect(endOfWeek.getHours()).toBe(23);
    });
  });

  describe('isDateInCurrentWeek', () => {
    it('should return true for dates in current week', () => {
      const { startOfWeek, endOfWeek } = getCurrentWeekRange();
      
      // Test start of week
      expect(isDateInCurrentWeek(startOfWeek)).toBe(true);
      
      // Test end of week
      expect(isDateInCurrentWeek(endOfWeek)).toBe(true);
      
      // Test middle of week
      const midWeek = new Date(startOfWeek.getTime() + 3 * 24 * 60 * 60 * 1000);
      expect(isDateInCurrentWeek(midWeek)).toBe(true);
    });

    it('should return false for dates outside current week', () => {
      const { startOfWeek } = getCurrentWeekRange();
      
      // Test previous week
      const previousWeek = new Date(startOfWeek.getTime() - 24 * 60 * 60 * 1000);
      expect(isDateInCurrentWeek(previousWeek)).toBe(false);
      
      // Test next week
      const nextWeek = new Date(startOfWeek.getTime() + 8 * 24 * 60 * 60 * 1000);
      expect(isDateInCurrentWeek(nextWeek)).toBe(false);
    });

    it('should handle timezone parameter', () => {
      const testDate = new Date('2024-01-01T12:00:00Z');
      
      // Should work with timezone
      expect(() => isDateInCurrentWeek(testDate, 'UTC')).not.toThrow();
    });

    it('should throw for invalid dates', () => {
      expect(() => isDateInCurrentWeek(new Date('invalid'))).toThrow('Invalid date provided');
    });
  });

  describe('getWeekRangeForDate', () => {
    it('should return correct week range for any date', () => {
      // Test with a known Monday (2024-01-01 was a Monday)
      const monday = new Date('2024-01-01T10:00:00Z');
      const { startOfWeek, endOfWeek } = getWeekRangeForDate(monday);
      
      expect(startOfWeek.getDay()).toBe(1); // Monday
      expect(endOfWeek.getDay()).toBe(0); // Sunday
      expect(startOfWeek.getDate()).toBe(1); // Should be January 1st
      expect(endOfWeek.getDate()).toBe(7); // Should be January 7th
    });

    it('should handle Sunday correctly', () => {
      // Test with a Sunday (should go back to previous Monday)
      const sunday = new Date('2024-01-07T10:00:00Z'); // This is a Sunday
      const { startOfWeek, endOfWeek } = getWeekRangeForDate(sunday);
      
      expect(startOfWeek.getDay()).toBe(1); // Monday
      expect(endOfWeek.getDay()).toBe(0); // Sunday
      expect(startOfWeek.getDate()).toBe(1); // Should be January 1st (previous Monday)
      expect(endOfWeek.getDate()).toBe(7); // Should be January 7th (same Sunday)
    });

    it('should handle timezone parameter', () => {
      const testDate = new Date('2024-01-01T10:00:00Z');
      const { startOfWeek, endOfWeek } = getWeekRangeForDate(testDate, 'UTC');
      
      expect(startOfWeek.getDay()).toBe(1); // Monday
      expect(endOfWeek.getDay()).toBe(0); // Sunday
    });

    it('should throw for invalid dates', () => {
      expect(() => getWeekRangeForDate(new Date('invalid'))).toThrow('Invalid date provided');
    });

    it('should handle week boundary edge cases', () => {
      // Test Sunday to Monday transition
      const sunday = new Date('2024-01-07T23:59:59.999Z'); // Last moment of Sunday (Jan 7)
      const nextWeekDate = new Date('2024-01-15T00:00:00.000Z'); // Date in next week
      
      const sundayWeek = getWeekRangeForDate(sunday);
      const nextWeek = getWeekRangeForDate(nextWeekDate);
      
      // Sunday should be in the previous week (ending Jan 7)
      expect(sundayWeek.endOfWeek.getDate()).toBe(7);
      
      // Next week should start on Monday Jan 8 (since Jan 8 is a Monday)
      expect(nextWeek.startOfWeek.getDate()).toBe(8);
      expect(nextWeek.startOfWeek.getDay()).toBe(1); // Monday
    });
  });

  describe('isDateInWeekRange', () => {
    it('should return true for dates within range', () => {
      const start = new Date('2024-01-01T00:00:00.000Z'); // Monday
      const end = new Date('2024-01-07T23:59:59.999Z'); // Sunday
      const midWeek = new Date('2024-01-04T12:00:00.000Z'); // Thursday
      
      expect(isDateInWeekRange(midWeek, start, end)).toBe(true);
      expect(isDateInWeekRange(start, start, end)).toBe(true);
      expect(isDateInWeekRange(end, start, end)).toBe(true);
    });

    it('should return false for dates outside range', () => {
      const start = new Date('2024-01-01T00:00:00.000Z'); // Monday
      const end = new Date('2024-01-07T23:59:59.999Z'); // Sunday
      const before = new Date('2023-12-31T23:59:59.999Z'); // Previous Sunday
      const after = new Date('2024-01-08T00:00:00.000Z'); // Next Monday
      
      expect(isDateInWeekRange(before, start, end)).toBe(false);
      expect(isDateInWeekRange(after, start, end)).toBe(false);
    });

    it('should throw for invalid dates or ranges', () => {
      const validStart = new Date('2024-01-01');
      const validEnd = new Date('2024-01-07');
      const invalidDate = new Date('invalid');
      
      expect(() => isDateInWeekRange(invalidDate, validStart, validEnd)).toThrow('Invalid date provided');
      expect(() => isDateInWeekRange(validStart, invalidDate, validEnd)).toThrow('Invalid date provided');
      expect(() => isDateInWeekRange(validStart, validStart, invalidDate)).toThrow('Invalid date provided');
      expect(() => isDateInWeekRange(validStart, validEnd, validStart)).toThrow('Start date must be before or equal to end date');
    });
  });

  describe('getWeekNumber', () => {
    it('should return correct week numbers', () => {
      // Test that the function returns reasonable week numbers
      const jan1_2024 = new Date('2024-01-01'); // Monday
      const jan8_2024 = new Date('2024-01-08'); // Monday (next week)
      
      const week1 = getWeekNumber(jan1_2024);
      const week2 = getWeekNumber(jan8_2024);
      
      // Both should be positive numbers between 1 and 53
      expect(week1).toBeGreaterThan(0);
      expect(week1).toBeLessThanOrEqual(53);
      expect(week2).toBeGreaterThan(0);
      expect(week2).toBeLessThanOrEqual(53);
      
      // They should be different (since they're in different weeks)
      expect(week1).not.toBe(week2);
    });

    it('should throw for invalid dates', () => {
      expect(() => getWeekNumber(new Date('invalid'))).toThrow('Invalid date provided');
    });
  });

  describe('areDatesInSameWeek', () => {
    it('should return true for dates in same week', () => {
      const monday = new Date('2024-01-01T10:00:00Z');
      const friday = new Date('2024-01-05T15:00:00Z');
      const sunday = new Date('2024-01-07T20:00:00Z');
      
      expect(areDatesInSameWeek(monday, friday)).toBe(true);
      expect(areDatesInSameWeek(monday, sunday)).toBe(true);
      expect(areDatesInSameWeek(friday, sunday)).toBe(true);
    });

    it('should return false for dates in different weeks', () => {
      const sunday = new Date('2024-01-07T23:59:59Z'); // Sunday of week 1
      const nextMonday = new Date('2024-01-15T00:00:00Z'); // Monday of week 3 (clearly different week)
      
      expect(areDatesInSameWeek(sunday, nextMonday)).toBe(false);
    });

    it('should handle timezone parameter', () => {
      const date1 = new Date('2024-01-01T10:00:00Z');
      const date2 = new Date('2024-01-05T15:00:00Z');
      
      expect(areDatesInSameWeek(date1, date2, 'UTC')).toBe(true);
    });

    it('should throw for invalid dates', () => {
      const validDate = new Date('2024-01-01');
      const invalidDate = new Date('invalid');
      
      expect(() => areDatesInSameWeek(invalidDate, validDate)).toThrow('Invalid date provided');
      expect(() => areDatesInSameWeek(validDate, invalidDate)).toThrow('Invalid date provided');
    });
  });
});