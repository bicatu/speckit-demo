import { Context } from 'koa';
import { z } from 'zod';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { DeleteStreamingPlatformCommand } from '../../../../application/commands/platforms/DeleteStreamingPlatformCommand';
import { DeleteStreamingPlatformCommandHandler } from '../../../../application/commands/platforms/DeleteStreamingPlatformCommandHandler';

const deletePlatformSchema = z.object({
  platformId: z.string().uuid('Platform ID must be a valid UUID'),
});

/**
 * DELETE /api/v1/platforms/:platformId
 * Delete a streaming platform (admin only)
 */
export async function deletePlatform(ctx: Context): Promise<void> {
  const validation = deletePlatformSchema.safeParse({
    platformId: ctx.params.platformId,
  });

  if (!validation.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Validation failed',
      details: validation.error.format(),
    };
    return;
  }

  try {
    const command = new DeleteStreamingPlatformCommand({
      platformId: validation.data.platformId,
    });

    const handler = HandlerRegistry.getCommandHandler<DeleteStreamingPlatformCommandHandler>(
      'DeleteStreamingPlatformCommand'
    );

    await handler.handle(command);

    ctx.status = 200;
    ctx.body = {
      message: 'Streaming platform deleted successfully',
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Platform not found') {
      ctx.status = 404;
      ctx.body = { error: 'Platform not found' };
      return;
    }

    if (error instanceof Error && error.message === 'Cannot delete platform that is referenced by entries') {
      ctx.status = 409;
      ctx.body = { error: 'Cannot delete platform that is referenced by entries' };
      return;
    }

    console.error('Error deleting platform:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete platform' };
  }
}
