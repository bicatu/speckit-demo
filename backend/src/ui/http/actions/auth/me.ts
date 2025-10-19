import { Context } from 'koa';
import { Container } from '../../../../config/Container';
import { AuthProviderFactory } from '../../../../infrastructure/external/AuthProviderFactory';
import { AuthErrorCode, createErrorResponse } from './errors';

/**
 * GET /api/auth/me
 * Returns current authenticated user information
 * 
 * Headers:
 * - Authorization: Bearer {accessToken}
 * 
 * Returns:
 * - user: Authenticated user information (id, email, displayName, isAdmin)
 */
export default async function me(ctx: Context): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = createErrorResponse(
        AuthErrorCode.UNAUTHORIZED,
        'Missing or invalid authorization header',
        { expected: 'Authorization: Bearer <token>' }
      );
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get services from container
    const container = Container.getInstance();
    const tokenCache = container.getTokenCache();
    const authProvider = AuthProviderFactory.getInstance();
    const userRepository = container.getUserRepository();

    // Check cache first
    let authUser = tokenCache.get(token);

    if (!authUser) {
      // Cache miss - validate token with auth provider
      try {
        authUser = await authProvider.verifyAccessToken(token);

        // Cache the validated token
        // Assume 1 hour expiration if not provided
        const expiresAt = Date.now() + (3600 * 1000);
        tokenCache.set(token, authUser, expiresAt);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isExpired = errorMessage.includes('expired') || errorMessage.includes('jwt expired');
        
        ctx.status = 401;
        ctx.body = createErrorResponse(
          isExpired ? AuthErrorCode.TOKEN_EXPIRED : AuthErrorCode.UNAUTHORIZED,
          isExpired ? 'Access token expired' : 'Invalid or malformed token',
          { tokenValidation: errorMessage }
        );
        return;
      }
    }

    // Lookup user in database for complete info
    const user = await userRepository.findByOAuthSubject(authUser.sub);

    if (!user) {
      ctx.status = 404;
      ctx.body = createErrorResponse(
        AuthErrorCode.UNAUTHORIZED,
        'User not found',
        { oauthSubject: authUser.sub }
      );
      return;
    }

    // Return user information
    ctx.status = 200;
    ctx.body = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.name,
        isAdmin: user.isAdmin,
      },
    };
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED');
    const isProviderDown = errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND');
    
    ctx.status = (isTimeout || isProviderDown) ? 503 : 500;
    ctx.body = createErrorResponse(
      AuthErrorCode.INTERNAL_ERROR,
      (isTimeout || isProviderDown) 
        ? 'Authentication provider unavailable'
        : 'Failed to retrieve user information',
      {
        provider: process.env.AUTH_PROVIDER || 'unknown',
        ...(error instanceof Error && { originalError: error.message }),
      }
    );
  }
}
