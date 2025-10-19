/**
 * Standard error response format for authentication endpoints
 * Matches OpenAPI ErrorResponse schema
 */

export enum AuthErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_FAILED = 'AUTH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ErrorResponse {
  error: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: AuthErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  const response: ErrorResponse = { error, message };
  if (details) {
    response.details = details;
  }
  return response;
}

/**
 * Format validation errors from Zod
 */
export function formatValidationErrors(errors: Array<{ path: (string | number)[]; message: string }>): ErrorResponse {
  return createErrorResponse(
    AuthErrorCode.VALIDATION_ERROR,
    'Invalid request parameters',
    {
      validationErrors: errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }
  );
}
