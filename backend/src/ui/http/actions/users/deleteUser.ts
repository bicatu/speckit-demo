import { Context } from 'koa';
import { DeleteUserCommand } from '../../../../application/commands/users/DeleteUserCommand';
import { DeleteUserCommandHandler } from '../../../../application/commands/users/DeleteUserCommandHandler';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';

/**
 * DELETE /api/v1/users/me - Delete user account
 * Implements FR-019: Anonymize user data when account is deleted
 * 
 * Authentication: Required
 * 
 * Responses:
 * - 204: Account deleted successfully (no content)
 * - 401: Unauthorized
 * - 403: Forbidden (attempting to delete last admin)
 * - 404: User not found
 * - 500: Server error
 */
export async function deleteUser(ctx: Context): Promise<void> {
  try {
    // Get authenticated user ID from context (set by auth middleware)
    const userId = ctx.state.user?.id;

    if (!userId) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized' };
      return;
    }

    // Get handler from registry
    const handler = HandlerRegistry.getCommandHandler<DeleteUserCommandHandler>('DeleteUserCommand');

    // Create and execute command
    let command;
    try {
      command = new DeleteUserCommand(userId);
    } catch (error) {
      // Handle validation errors from command constructor (e.g., invalid UUID)
      ctx.status = 400;
      ctx.body = {
        error: error instanceof Error ? error.message : 'Invalid user ID',
      };
      return;
    }

    const result = await handler.handle(command);

    if (!result.success) {
      if (result.error === 'User not found') {
        ctx.status = 404;
        ctx.body = { error: result.error };
        return;
      }

      if (result.error?.includes('last admin')) {
        ctx.status = 403;
        ctx.body = { error: result.error };
        return;
      }

      ctx.status = 500;
      ctx.body = { error: result.error || 'Failed to delete account' };
      return;
    }

    // Success - 204 No Content
    ctx.status = 204;
  } catch (error) {
    console.error('Error deleting user:', error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to delete account',
    };
  }
}
