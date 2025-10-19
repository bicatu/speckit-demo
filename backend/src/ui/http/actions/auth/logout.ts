import { Context } from 'koa';
import { Container } from '../../../../config/Container';
import { AuthProviderFactory } from '../../../../infrastructure/external/AuthProviderFactory';

/**
 * POST /api/auth/logout
 * Logout current user and invalidate session
 * Optionally returns logout URL for identity provider logout
 */
export const logout = async (ctx: Context) => {
  try {
    const authHeader = ctx.request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = { error: 'No access token provided' };
      return;
    }

    const token = authHeader.substring(7);
    const container = Container.getInstance();
    const tokenCache = container.getTokenCache();
    const authProvider = AuthProviderFactory.getInstance();

    // Invalidate token in cache
    tokenCache.delete(token);

    // Get logout URL from provider if available
    let logoutUrl: string | undefined;
    try {
      if (authProvider.getLogoutUrl) {
        logoutUrl = authProvider.getLogoutUrl();
      }
    } catch (err) {
      console.error('Failed to get logout URL from provider:', err);
      // Continue with logout even if provider logout URL fails
    }

    ctx.status = 200;
    ctx.body = {
      success: true,
      ...(logoutUrl && { logoutUrl }),
    };
  } catch (err) {
    console.error('Logout error:', err);
    ctx.status = 500;
    ctx.body = { error: 'Logout failed' };
  }
};
