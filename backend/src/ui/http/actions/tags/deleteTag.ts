import { Context } from 'koa';
import { z } from 'zod';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { DeleteGenreTagCommand } from '../../../../application/commands/tags/DeleteGenreTagCommand';
import { DeleteGenreTagCommandHandler } from '../../../../application/commands/tags/DeleteGenreTagCommandHandler';

const deleteTagSchema = z.object({
  tagId: z.string().uuid('Tag ID must be a valid UUID'),
});

/**
 * DELETE /api/v1/tags/:tagId
 * Delete a genre tag (admin only)
 */
export async function deleteTag(ctx: Context): Promise<void> {
  const validation = deleteTagSchema.safeParse({
    tagId: ctx.params.tagId,
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
    const command = new DeleteGenreTagCommand({
      tagId: validation.data.tagId,
    });

    const handler = HandlerRegistry.getCommandHandler<DeleteGenreTagCommandHandler>(
      'DeleteGenreTagCommand'
    );

    await handler.handle(command);

    ctx.status = 200;
    ctx.body = {
      message: 'Genre tag deleted successfully',
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Tag not found') {
      ctx.status = 404;
      ctx.body = { error: 'Tag not found' };
      return;
    }

    if (error instanceof Error && error.message === 'Cannot delete tag that is referenced by entries') {
      ctx.status = 409;
      ctx.body = { error: 'Cannot delete tag that is referenced by entries' };
      return;
    }

    console.error('Error deleting tag:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete tag' };
  }
}
