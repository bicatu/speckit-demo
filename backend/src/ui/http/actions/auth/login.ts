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

  const { returnUrl, code_challenge, code_challenge_method, state: clientState } = validation.data;

  try {
    // Get services from container
    const container = Container.getInstance();
    const oauthStateManager = container.getOAuthStateManager();
    const authProvider = AuthProviderFactory.getInstance();

    // Use client-provided state if available, otherwise generate one
    const state = clientState || oauthStateManager.create(returnUrl);
    
    // If client provided state, we still need to register it
    if (clientState) {
      oauthStateManager.create(returnUrl, clientState);
    }

    // Get OAuth redirect URI from environment
    const redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback';

    // Prepare PKCE parameters if provided
    const pkceParams = code_challenge && code_challenge_method === 'S256'
      ? { codeChallenge: code_challenge, codeChallengeMethod: 'S256' as const }
      : undefined;

    // Generate authorization URL with optional PKCE parameters
    const authUrl = authProvider.getAuthorizationUrl(redirectUri, state, pkceParams);

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
