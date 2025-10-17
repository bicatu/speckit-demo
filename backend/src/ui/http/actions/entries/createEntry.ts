import { Context } from 'koa';
import { z } from 'zod';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { CreateEntryCommandHandler } from '../../../../application/commands/entries/CreateEntryCommandHandler';

// Zod schema for create entry request
const CreateEntryRequestSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  mediaType: z.enum(['film', 'series']),
  tagIds: z.array(z.string().uuid()).min(1).max(3),
  platformId: z.string().uuid().optional(),
  initialRating: z.number().int().min(1).max(10).optional(),
});

/**
 * Create a new entry (movie or series)
 * POST /api/v1/entries
 */
export async function createEntry(ctx: Context): Promise<void> {
  try {
    // Parse and validate request body
    const parseResult = CreateEntryRequestSchema.safeParse(ctx.request.body);
    if (!parseResult.success) {
      ctx.status = 400;
      ctx.body = {
        error: 'Validation failed',
        details: parseResult.error.errors,
      };
      return;
    }

    const { title, mediaType, tagIds, platformId, initialRating } = parseResult.data;

    // Get user ID from authenticated user (from auth middleware)
    const userId = ctx.state.user?.id;
    if (!userId) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized' };
      return;
    }

    // Get handler from registry
    const handler = HandlerRegistry.getCommandHandler<CreateEntryCommandHandler>('CreateEntryCommand');

    // Execute command
    const result = await handler.handle({
      commandId: crypto.randomUUID(),
      timestamp: new Date(),
      userId,
      title,
      mediaType,
      tagIds,
      platformId,
      initialRating,
    });

    if (result.success) {
      ctx.status = 201;
      ctx.body = {
        message: 'Entry created successfully',
        entryId: result.resourceId,
      };
    } else {
      // Check for title uniqueness error
      if (result.error?.includes('already exists')) {
        ctx.status = 409;
        ctx.body = { error: result.error };
      } else {
        ctx.status = 400;
        ctx.body = { error: result.error };
      }
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}
