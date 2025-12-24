import { describe, it, expect } from 'vitest';
import { validateClubId, validateClubName, validateClubFields, parseServerError } from './validation';

describe('Club Validation', () => {
  describe('validateClubId', () => {
    it('should validate correct club IDs', () => {
      expect(validateClubId('default-club-001')).toEqual({ isValid: true });
      expect(validateClubId('club123')).toEqual({ isValid: true });
      expect(validateClubId('ABC-123-XYZ')).toEqual({ isValid: true });
    });

    it('should reject empty club IDs', () => {
      expect(validateClubId('')).toEqual({
        isValid: false,
        error: 'Club ID is required'
      });
      expect(validateClubId('   ')).toEqual({
        isValid: false,
        error: 'Club ID is required'
      });
    });

    it('should reject club IDs with invalid characters', () => {
      expect(validateClubId('club@123')).toEqual({
        isValid: false,
        error: 'Club ID must contain only alphanumeric characters and hyphens'
      });
      expect(validateClubId('club_123')).toEqual({
        isValid: false,
        error: 'Club ID must contain only alphanumeric characters and hyphens'
      });
    });

    it('should reject club IDs that are too long', () => {
      const longClubId = 'a'.repeat(51);
      expect(validateClubId(longClubId)).toEqual({
        isValid: false,
        error: 'Club ID must be 50 characters or less'
      });
    });
  });

  describe('validateClubName', () => {
    it('should validate correct club names', () => {
      expect(validateClubName('ShuttleMentor Academy')).toEqual({ isValid: true });
      expect(validateClubName('A')).toEqual({ isValid: true });
      expect(validateClubName('Club with spaces and numbers 123')).toEqual({ isValid: true });
    });

    it('should reject empty club names', () => {
      expect(validateClubName('')).toEqual({
        isValid: false,
        error: 'Club name is required'
      });
      expect(validateClubName('   ')).toEqual({
        isValid: false,
        error: 'Club name is required'
      });
    });

    it('should reject club names that are too long', () => {
      const longClubName = 'a'.repeat(101);
      expect(validateClubName(longClubName)).toEqual({
        isValid: false,
        error: 'Club name must be 100 characters or less'
      });
    });
  });

  describe('validateClubFields', () => {
    it('should validate when both fields are correct', () => {
      const result = validateClubFields('default-club-001', 'ShuttleMentor Academy');
      expect(result.isValid).toBe(true);
      expect(result.clubId.isValid).toBe(true);
      expect(result.clubName.isValid).toBe(true);
    });

    it('should invalidate when either field is incorrect', () => {
      const result = validateClubFields('invalid@club', 'ShuttleMentor Academy');
      expect(result.isValid).toBe(false);
      expect(result.clubId.isValid).toBe(false);
      expect(result.clubName.isValid).toBe(true);
    });
  });

  describe('parseServerError', () => {
    it('should parse club ID validation errors', () => {
      const error = parseServerError('Club ID must contain only alphanumeric characters and hyphens');
      expect(error.clubId).toBe('Club ID must contain only alphanumeric characters and hyphens');
      expect(error.general).toBeUndefined();
    });

    it('should parse club name validation errors', () => {
      const error = parseServerError('Club name must be 100 characters or less');
      expect(error.clubName).toBe('Club name must be 100 characters or less');
      expect(error.general).toBeUndefined();
    });

    it('should handle generic errors', () => {
      const error = parseServerError('Network error occurred');
      expect(error.general).toBe('Network error occurred');
      expect(error.clubId).toBeUndefined();
      expect(error.clubName).toBeUndefined();
    });
  });
});