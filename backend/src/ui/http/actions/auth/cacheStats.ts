import { Context } from 'koa';
import { Container } from '../../../../config/Container';

/**
 * GET /api/auth/cache-stats - Get token cache statistics (admin only)
 * 
 * Returns performance metrics for token cache:
 * - Current cache size
 * - Maximum cache size
 * - Cache hit rate
 * - Eviction count
 * 
 * Authentication: Required (admin only)
 * 
 * Responses:
 * - 200: Cache statistics returned
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 */
export default async function cacheStats(ctx: Context): Promise<void> {
  const container = Container.getInstance();
  const tokenCache = container.getTokenCache();

  const stats = tokenCache.getStats();

  ctx.status = 200;
  ctx.body = {
    size: stats.size,
    maxSize: stats.maxSize,
    hitRate: stats.hitRate,
    evictionCount: stats.evictionCount,
    utilizationPercent: (stats.size / stats.maxSize) * 100,
  };
}
