import { Context, Next } from 'koa';
import { WorkOSClient } from '../../infrastructure/external/WorkOSClient';

/**
 * Authenticated user context added to Koa state
 */
export interface AuthenticatedUser {
  userId: string;
  oauthSubject: string;
}

/**
 * Authentication middleware
 * Verifies Bearer token and adds user info to context state
 */
export async function authMiddleware(ctx: Context, next: Next): Promise<void> {
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { error: 'Missing or invalid authorization header' };
    return;
  }

  const token = authHeader.substring(7);

  try {
    const { sub } = await WorkOSClient.verifyAccessToken(token);

    // Add authenticated user to context state
    ctx.state.user = {
      userId: sub,
      oauthSubject: sub,
    } as AuthenticatedUser;

    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid or expired access token' };
  }
}

/**
 * Admin authorization middleware
 * Must be used after authMiddleware
 * Checks if authenticated user has admin privileges
 */
export async function adminMiddleware(ctx: Context, next: Next): Promise<void> {
  const user = ctx.state.user as AuthenticatedUser | undefined;

  if (!user) {
    ctx.status = 401;
    ctx.body = { error: 'Authentication required' };
    return;
  }

  // TODO: Query database to check if user has admin flag
  // For now, this is a placeholder - actual implementation in Phase 3
  const isAdmin = false; // Will be implemented with User repository

  if (!isAdmin) {
    ctx.status = 403;
    ctx.body = { error: 'Admin privileges required' };
    return;
  }

  await next();
}
