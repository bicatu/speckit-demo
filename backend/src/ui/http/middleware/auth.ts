import { Context, Next } from 'koa';
import { AuthProviderFactory } from '../../../infrastructure/external/AuthProviderFactory';
import { Container } from '../../../config/Container';

/**
 * Authenticated user context added to Koa state
 */
export interface AuthenticatedUser {
  id: string;
  userId: string;
  oauthSubject: string;
  isAdmin?: boolean;
}

/**
 * Authentication middleware
 * Verifies Bearer token and adds user info to context state
 * Uses configured auth provider (Mock, Keycloak, or WorkOS)
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
    // Use configured auth provider to verify token
    const authProvider = AuthProviderFactory.getInstance();
    const authUser = await authProvider.verifyAccessToken(token);

    // Get user from database to check approval status and admin status
    const container = Container.getInstance();
    const userRepository = container.getUserRepository();
    const user = await userRepository.findByOAuthSubject(authUser.sub);

    // Check approval status (FR-017: pending/rejected users get 403)
    if (user && !user.isApproved()) {
      ctx.status = 403;
      if (user.isPending()) {
        ctx.body = { error: 'Account pending approval. Please wait for administrator approval.' };
      } else if (user.isRejected()) {
        ctx.body = { error: 'Account access has been rejected.' };
      }
      return;
    }

    // Prioritize database admin status over token claim (database is source of truth)
    const isAdmin = user?.isAdmin ?? authUser.isAdmin ?? false;

    // Add authenticated user to context state
    ctx.state.user = {
      id: user?.id || authUser.sub,
      userId: user?.id || authUser.sub,
      oauthSubject: authUser.sub,
      isAdmin,
    } as AuthenticatedUser;

    // TODO: Record login asynchronously (T131)
    // This should be done via UserRepository.findByOAuthSubject() -> user.recordLogin() -> UserRepository.save()
    // Skipped for now to avoid blocking authentication response
    // Will be implemented when full OAuth integration is complete

    await next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Authentication failed:', errorMessage);
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

  if (!user.isAdmin) {
    ctx.status = 403;
    ctx.body = { error: 'Admin privileges required' };
    return;
  }

  await next();
}
