import { Context } from 'koa';
import { z } from 'zod';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { CreateGenreTagCommand } from '../../../../application/commands/tags/CreateGenreTagCommand';
import { CreateGenreTagCommandHandler } from '../../../../application/commands/tags/CreateGenreTagCommandHandler';

const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required'),
});

/**
 * POST /api/v1/tags
 * Create a new genre tag (admin only)
 */
export async function createTag(ctx: Context): Promise<void> {
  const validation = createTagSchema.safeParse(ctx.request.body);

  if (!validation.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Validation failed',
      details: validation.error.format(),
    };
    return;
  }

  try {
    const command = new CreateGenreTagCommand({
      name: validation.data.name,
    });

    const handler = HandlerRegistry.getCommandHandler<CreateGenreTagCommandHandler>(
      'CreateGenreTagCommand'
    );

    const result = await handler.handle(command);

    ctx.status = 201;
    ctx.body = {
      tagId: result.resourceId,
      message: 'Genre tag created successfully',
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Tag already exists') {
      ctx.status = 409;
      ctx.body = { error: 'Tag already exists' };
      return;
    }

    console.error('Error creating tag:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create tag' };
  }
}
