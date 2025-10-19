import { Context } from 'koa';
import { z } from 'zod';
import { GetPendingUsersQuery } from '../../../../application/queries/users/GetPendingUsersQuery';
import { GetPendingUsersQueryHandler } from '../../../../application/queries/users/GetPendingUsersQueryHandler';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';

/**
 * Zod schema for GetPendingUsers request (no parameters needed)
 */
const GetPendingUsersRequestSchema = z.object({}).optional();

/**
 * GET /api/users/pending - Get all pending users
 * Admin-only endpoint
 * 
 * Returns list of users with pending approval status
 * 
 * Authentication: Required (admin only)
 * 
 * Responses:
 * - 200: List of pending users
 * - 401: Unauthorized
 * - 403: Forbidden (non-admin user)
 * - 500: Server error
 */
export async function getPendingUsers(ctx: Context): Promise<void> {
  try {
    // Admin-only check
    const user = ctx.state.user;
    if (!user || !user.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    // Validate request (no parameters needed, but validate anyway)
    const validation = GetPendingUsersRequestSchema.safeParse({});
    if (!validation.success) {
      ctx.status = 400;
      ctx.body = {
        error: 'Invalid request',
        details: validation.error.errors,
      };
      return;
    }

    // Get handler from registry
    const handler = HandlerRegistry.getQueryHandler<GetPendingUsersQueryHandler>('GetPendingUsersQuery');

    // Create and execute query
    const query = new GetPendingUsersQuery();
    const result = await handler.handle(query);

    if (!result.success) {
      ctx.status = 500;
      ctx.body = { error: result.error || 'Failed to retrieve pending users' };
      return;
    }

    // Success
    ctx.status = 200;
    ctx.body = {
      users: result.data || [],
    };
  } catch (error) {
    console.error('Error retrieving pending users:', error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to retrieve pending users',
    };
  }
}
