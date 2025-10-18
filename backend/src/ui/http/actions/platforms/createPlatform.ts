import { Context } from 'koa';
import { z } from 'zod';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { CreateStreamingPlatformCommand } from '../../../../application/commands/platforms/CreateStreamingPlatformCommand';
import { CreateStreamingPlatformCommandHandler } from '../../../../application/commands/platforms/CreateStreamingPlatformCommandHandler';

const createPlatformSchema = z.object({
  name: z.string().trim().min(1, 'Platform name is required'),
});

/**
 * POST /api/v1/platforms
 * Create a new streaming platform (admin only)
 */
export async function createPlatform(ctx: Context): Promise<void> {
  const validation = createPlatformSchema.safeParse(ctx.request.body);

  if (!validation.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Validation failed',
      details: validation.error.format(),
    };
    return;
  }

  try {
    const command = new CreateStreamingPlatformCommand({
      name: validation.data.name,
    });

    const handler = HandlerRegistry.getCommandHandler<CreateStreamingPlatformCommandHandler>(
      'CreateStreamingPlatformCommand'
    );

    const result = await handler.handle(command);

    ctx.status = 201;
    ctx.body = {
      platformId: result.resourceId,
      message: 'Streaming platform created successfully',
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Platform already exists') {
      ctx.status = 409;
      ctx.body = { error: 'Platform already exists' };
      return;
    }

    console.error('Error creating platform:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create platform' };
  }
}
