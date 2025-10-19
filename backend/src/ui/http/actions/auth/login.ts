import { Context } from 'koa';
import { LoginRequestSchema } from './schemas';
import { Container } from '../../../../config/Container';
import { AuthProviderFactory } from '../../../../infrastructure/external/AuthProviderFactory';
import { AuthErrorCode, createErrorResponse, formatValidationErrors } from './errors';

/**
 * GET /api/auth/login
 * Initiates OAuth login flow by generating authorization URL
 * 
 * Query parameters:
 * - returnUrl (optional): URL to redirect after successful authentication (default: '/')
 * 
 * Returns:
 * - authUrl: OAuth provider authorization URL to redirect user to
 * - state: OAuth state parameter (for debugging/logging)
 */
export default async function login(ctx: Context): Promise<void> {
  // Validate query parameters
  const validation = LoginRequestSchema.safeParse(ctx.query);
  
  if (!validation.success) {
    ctx.status = 400;
    ctx.body = formatValidationErrors(validation.error.errors);
    return;
  }

  const { returnUrl } = validation.data;

  try {
    // Get services from container
    const container = Container.getInstance();
    const oauthStateManager = container.getOAuthStateManager();
    const authProvider = AuthProviderFactory.getInstance();

    // Generate OAuth state for CSRF protection
    const state = oauthStateManager.create(returnUrl);

    // Get OAuth redirect URI from environment
    const redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback';

    // Generate authorization URL
    const authUrl = authProvider.getAuthorizationUrl(redirectUri, state);

    // Return authorization URL
    ctx.status = 200;
    ctx.body = {
      authUrl,
      state, // Include state for potential client-side tracking
    };
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    
    // Check if it's a timeout/network error
    const isTimeout = error instanceof Error && 
      (error.message.includes('timeout') || error.message.includes('ECONNABORTED'));
    
    ctx.status = isTimeout ? 503 : 500;
    ctx.body = createErrorResponse(
      isTimeout ? AuthErrorCode.INTERNAL_ERROR : AuthErrorCode.INTERNAL_ERROR,
      isTimeout 
        ? 'Authentication provider unavailable - please try again'
        : 'Failed to initiate login',
      {
        provider: process.env.AUTH_PROVIDER || 'unknown',
        ...(error instanceof Error && { originalError: error.message }),
      }
    );
  }
}
