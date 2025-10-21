import { Context } from 'koa';
import { z } from 'zod';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { AddRatingCommand } from '../../../../application/commands/ratings/AddRatingCommand';
import { UpdateRatingCommand } from '../../../../application/commands/ratings/UpdateRatingCommand';
import { AddRatingCommandHandler } from '../../../../application/commands/ratings/AddRatingCommandHandler';
import { UpdateRatingCommandHandler } from '../../../../application/commands/ratings/UpdateRatingCommandHandler';

// Zod schema for rating request
const RatingRequestSchema = z.object({
  stars: z.number().int().min(1).max(10).refine((val) => Number.isInteger(val), {
    message: 'Stars must be a whole number between 1 and 10',
  }),
});

/**
 * Add or update a rating for an entry
 * POST /api/v1/entries/:entryId/ratings
 */
export async function addRating(ctx: Context): Promise<void> {
  try {
    // Get entry ID from URL params
    const entryId = ctx.params.entryId;
    if (!entryId) {
      ctx.status = 400;
      ctx.body = { error: 'Entry ID is required' };
      return;
    }

    // Parse and validate request body
    const parseResult = RatingRequestSchema.safeParse(ctx.request.body);
    if (!parseResult.success) {
      ctx.status = 400;
      ctx.body = { error: parseResult.error.errors[0].message };
      return;
    }

    const { stars } = parseResult.data;

    // Get user ID from authenticated user (from auth middleware)
    const userId = ctx.state.user?.id;
    if (!userId) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized' };
      return;
    }

    // Get handlers from registry
    const addHandler = HandlerRegistry.getCommandHandler<AddRatingCommandHandler>('AddRatingCommand');
    const updateHandler = HandlerRegistry.getCommandHandler<UpdateRatingCommandHandler>('UpdateRatingCommand');

    // Check if user has existing rating
    // We need the rating repository to check for existing rating
    // For now, we'll attempt to add and catch the error if it exists
    const addCommand = new AddRatingCommand(userId, entryId, stars);
    const addResult = await addHandler.handle(addCommand);

    if (addResult.success) {
      ctx.status = 201;
      ctx.body = {
        message: 'Rating added successfully',
        rating: {
          userId,
          entryId,
          stars,
        },
      };
      return;
    }

    // If add failed because rating exists, try update
    if (addResult.error?.includes('already rated')) {
      const updateCommand = new UpdateRatingCommand(userId, entryId, stars);
      const updateResult = await updateHandler.handle(updateCommand);

      if (updateResult.success) {
        ctx.status = 200;
        ctx.body = {
          message: 'Rating updated successfully',
          rating: {
            userId,
            entryId,
            stars,
          },
        };
      } else {
        ctx.status = 400;
        ctx.body = { error: updateResult.error };
      }
    } else {
      ctx.status = 400;
      ctx.body = { error: addResult.error };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}
