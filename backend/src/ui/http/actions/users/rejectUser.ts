import { Context } from 'koa';
import { z } from 'zod';
import { RejectUserCommand } from '../../../../application/commands/users/RejectUserCommand';
import { RejectUserCommandHandler } from '../../../../application/commands/users/RejectUserCommandHandler';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';

/**
 * Zod schema for RejectUser request
 * userId comes from route parameter
 */
const RejectUserRequestSchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
});

/**
 * POST /api/users/:id/reject - Reject a pending user
 * Admin-only endpoint
 * 
 * Changes user's approval_status from 'pending' to 'rejected'
 * 
 * Authentication: Required (admin only)
 * 
 * Responses:
 * - 200: User rejected successfully
 * - 400: Invalid user ID
 * - 401: Unauthorized
 * - 403: Forbidden (non-admin user)
 * - 404: User not found
 * - 500: Server error
 */
export async function rejectUser(ctx: Context): Promise<void> {
  try {
    // Admin-only check
    const currentUser = ctx.state.user;
    if (!currentUser || !currentUser.isAdmin) {
      ctx.status = 403;
      ctx.body = { error: 'Admin access required' };
      return;
    }

    // Validate request
    const validation = RejectUserRequestSchema.safeParse({
      userId: ctx.params.id,
    });

    if (!validation.success) {
      ctx.status = 400;
      ctx.body = {
        error: 'Invalid request',
        details: validation.error.errors,
      };
      return;
    }

    const { userId } = validation.data;

    // Get handler from registry
    const handler = HandlerRegistry.getCommandHandler<RejectUserCommandHandler>('RejectUserCommand');

    // Create and execute command
    let command;
    try {
      command = new RejectUserCommand(userId, currentUser.id);
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        error: error instanceof Error ? error.message : 'Invalid request',
      };
      return;
    }

    const result = await handler.handle(command);

    if (!result.success) {
      if (result.error === 'User not found' || result.error === 'Admin user not found') {
        ctx.status = 404;
        ctx.body = { error: result.error };
        return;
      }

      if (result.error?.includes('already rejected')) {
        ctx.status = 400;
        ctx.body = { error: result.error };
        return;
      }

      ctx.status = 500;
      ctx.body = { error: result.error || 'Failed to reject user' };
      return;
    }

    // Success
    ctx.status = 200;
    ctx.body = {
      message: 'User rejected successfully',
      userId: result.resourceId,
    };
  } catch (error) {
    console.error('Error rejecting user:', error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to reject user',
    };
  }
}
