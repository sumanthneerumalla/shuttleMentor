/**
 * Client-side validation utilities for form fields
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates club ID format
 * Requirements: alphanumeric characters and hyphens only, 1-50 characters
 */
export function validateClubId(clubId: string): ValidationResult {
  if (!clubId || clubId.trim().length === 0) {
    return {
      isValid: false,
      error: "Club ID is required"
    };
  }

  const trimmedClubId = clubId.trim();

  if (trimmedClubId.length < 1) {
    return {
      isValid: false,
      error: "Club ID must be at least 1 character"
    };
  }

  if (trimmedClubId.length > 50) {
    return {
      isValid: false,
      error: "Club ID must be 50 characters or less"
    };
  }

  const clubIdRegex = /^[a-zA-Z0-9-]+$/;
  if (!clubIdRegex.test(trimmedClubId)) {
    return {
      isValid: false,
      error: "Club ID must contain only alphanumeric characters and hyphens"
    };
  }

  return { isValid: true };
}

/**
 * Validates club name length
 * Requirements: 1-100 characters
 */
export function validateClubName(clubName: string): ValidationResult {
  if (!clubName || clubName.trim().length === 0) {
    return {
      isValid: false,
      error: "Club name is required"
    };
  }

  const trimmedClubName = clubName.trim();

  if (trimmedClubName.length < 1) {
    return {
      isValid: false,
      error: "Club name must be at least 1 character"
    };
  }

  if (trimmedClubName.length > 100) {
    return {
      isValid: false,
      error: "Club name must be 100 characters or less"
    };
  }

  return { isValid: true };
}

/**
 * Validates all club fields together
 */
export function validateClubFields(clubId: string, clubName: string): {
  clubId: ValidationResult;
  clubName: ValidationResult;
  isValid: boolean;
} {
  const clubIdValidation = validateClubId(clubId);
  const clubNameValidation = validateClubName(clubName);

  return {
    clubId: clubIdValidation,
    clubName: clubNameValidation,
    isValid: clubIdValidation.isValid && clubNameValidation.isValid
  };
}

/**
 * Parses tRPC error messages to extract field-specific validation errors
 */
export function parseServerError(errorMessage: string): {
  general?: string;
  clubId?: string;
  clubName?: string;
} {
  const errors: { general?: string; clubId?: string; clubName?: string } = {};

  // Check for specific club validation errors
  if (errorMessage.includes("Club ID must contain only alphanumeric characters and hyphens")) {
    errors.clubId = "Club ID must contain only alphanumeric characters and hyphens";
  } else if (errorMessage.includes("Club ID must be at least 1 character")) {
    errors.clubId = "Club ID must be at least 1 character";
  } else if (errorMessage.includes("Club ID must be 50 characters or less")) {
    errors.clubId = "Club ID must be 50 characters or less";
  } else if (errorMessage.includes("Club name must be at least 1 character")) {
    errors.clubName = "Club name must be at least 1 character";
  } else if (errorMessage.includes("Club name must be 100 characters or less")) {
    errors.clubName = "Club name must be 100 characters or less";
  } else {
    // Generic error
    errors.general = errorMessage;
  }

  return errors;
}