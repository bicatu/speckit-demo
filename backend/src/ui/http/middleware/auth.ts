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

    // If provider doesn't give us admin status, check database
    let isAdmin = authUser.isAdmin;
    if (isAdmin === undefined) {
      const container = Container.getInstance();
      const userRepository = container.getUserRepository();
      const user = await userRepository.findByOAuthSubject(authUser.sub);
      isAdmin = user?.isAdmin ?? false;
    }

    // Add authenticated user to context state
    ctx.state.user = {
      id: authUser.sub,
      userId: authUser.sub,
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
