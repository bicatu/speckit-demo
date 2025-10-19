import { Context } from 'koa';
import { randomUUID } from 'crypto';
import { AuthCallbackRequestSchema } from './schemas';
import { Container } from '../../../../config/Container';
import { AuthProviderFactory } from '../../../../infrastructure/external/AuthProviderFactory';
import { User } from '../../../../domain/entities/User';
import { AuthErrorCode, createErrorResponse, formatValidationErrors } from './errors';

/**
 * POST /api/auth/callback
 * Handles OAuth callback with authorization code
 * 
 * Request body:
 * - code: Authorization code from OAuth provider
 * - state: OAuth state parameter for CSRF validation
 * 
 * Returns:
 * - accessToken: JWT access token for API requests
 * - user: Authenticated user information (id, email, displayName, isAdmin)
 */
export default async function callback(ctx: Context): Promise<void> {
  // Validate request body
  const validation = AuthCallbackRequestSchema.safeParse(ctx.request.body);
  
  if (!validation.success) {
    ctx.status = 400;
    ctx.body = formatValidationErrors(validation.error.errors);
    return;
  }

  const { code, state } = validation.data;

  try {
    // Get services from container
    const container = Container.getInstance();
    const oauthStateManager = container.getOAuthStateManager();
    const authProvider = AuthProviderFactory.getInstance();
    const tokenCache = container.getTokenCache();
    const userRepository = container.getUserRepository();

    // Validate OAuth state
    const oauthState = oauthStateManager.validate(state);
    if (!oauthState) {
      ctx.status = 401;
      ctx.body = createErrorResponse(
        AuthErrorCode.AUTH_FAILED,
        'Invalid or expired state parameter',
        { state: 'State token not found or expired (10 minute limit)' }
      );
      return;
    }

    // Delete state after validation (single use)
    oauthStateManager.delete(state);

    // Get OAuth redirect URI from environment
    const redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback';

    // Exchange authorization code for access token
    const authResult = await authProvider.authenticateWithCode(code, redirectUri);

    // Lookup or create user by OAuth subject
    const oauthSubject = authResult.user.sub;
    let user = await userRepository.findByOAuthSubject(oauthSubject);

    if (!user) {
      // Create new user
      const email = authResult.user.email || `${oauthSubject}@oauth.local`;
      const displayName = authResult.user.firstName && authResult.user.lastName
        ? `${authResult.user.firstName} ${authResult.user.lastName}`
        : authResult.user.firstName || authResult.user.email || 'User';

      user = new User({
        id: randomUUID(),
        oauthSubject,
        email,
        name: displayName,
        isAdmin: authResult.user.isAdmin || false,
        lastLogin: new Date(),
        createdAt: new Date(),
      });

      await userRepository.save(user);
    } else {
      // Update last login timestamp
      await userRepository.updateLastLogin(user.id, new Date());
    }

    // Cache the token with expiration
    const expiresAt = authResult.expiresIn 
      ? Date.now() + (authResult.expiresIn * 1000)
      : Date.now() + (3600 * 1000); // Default 1 hour

    tokenCache.set(authResult.accessToken, {
      sub: user.oauthSubject,
      email: user.email,
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ').slice(1).join(' ') || undefined,
      isAdmin: user.isAdmin,
    }, expiresAt);

    // Return access token and user info
    ctx.status = 200;
    ctx.body = {
      accessToken: authResult.accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.name,
        isAdmin: user.isAdmin,
      },
      returnUrl: oauthState.returnUrl,
    };
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Determine error type
    const isInvalidCode = errorMessage.includes('invalid') || errorMessage.includes('code');
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED');
    const isProviderError = errorMessage.includes('Token exchange failed');
    
    let status = 500;
    let errorCode = AuthErrorCode.INTERNAL_ERROR;
    let message = 'Authentication failed';
    
    if (isInvalidCode) {
      status = 401;
      errorCode = AuthErrorCode.AUTH_FAILED;
      message = 'Invalid authorization code';
    } else if (isTimeout || isProviderError) {
      status = 503;
      errorCode = AuthErrorCode.INTERNAL_ERROR;
      message = 'Authentication provider unavailable - please try again';
    }
    
    ctx.status = status;
    ctx.body = createErrorResponse(
      errorCode,
      message,
      {
        provider: process.env.AUTH_PROVIDER || 'unknown',
        ...(error instanceof Error && { originalError: error.message }),
      }
    );
  }
}
