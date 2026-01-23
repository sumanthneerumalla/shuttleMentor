/**
 * Parses tRPC error messages to extract field-specific validation errors
 */
export function parseServerError(errorMessage: string): {
  general?: string;
} {
  return { general: errorMessage };
}