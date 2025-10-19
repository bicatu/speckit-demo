import { z } from 'zod';

/**
 * Zod schema for OAuth callback request
 * Validates authorization code and state parameter from OAuth provider redirect
 */
export const AuthCallbackRequestSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().regex(/^[a-f0-9]{64}$/, 'State must be a 64-character hex string'),
});

export type AuthCallbackRequest = z.infer<typeof AuthCallbackRequestSchema>;

/**
 * Zod schema for login request query parameters
 * Validates optional return URL for redirect after successful authentication
 */
export const LoginRequestSchema = z.object({
  returnUrl: z.string().optional().default('/'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

