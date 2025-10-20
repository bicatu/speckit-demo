import { z } from 'zod';

/**
 * Zod schema for OAuth callback request
 * Validates authorization code, state parameter, and optional PKCE code_verifier from OAuth provider redirect
 */
export const AuthCallbackRequestSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  code_verifier: z.string().min(43).max(128).optional(),
});

export type AuthCallbackRequest = z.infer<typeof AuthCallbackRequestSchema>;

/**
 * Zod schema for login request query parameters
 * Validates optional return URL and PKCE parameters for redirect after successful authentication
 */
export const LoginRequestSchema = z.object({
  returnUrl: z.string().optional().default('/'),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(['S256']).optional(),
  state: z.string().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

