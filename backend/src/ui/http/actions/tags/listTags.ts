import { Context } from 'koa';
import { v4 as uuidv4 } from 'uuid';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { GetGenreTagsQuery } from '../../../../application/queries/tags/GetGenreTagsQuery';
import { GetGenreTagsQueryHandler } from '../../../../application/queries/tags/GetGenreTagsQueryHandler';
import { formatErrorResponse } from '../../utils/errors';

/**
 * GET /api/tags - List all genre tags
 */
export async function listTags(ctx: Context): Promise<void> {
  try {
    const query: GetGenreTagsQuery = {
      queryId: uuidv4(),
      timestamp: new Date(),
    };

    const handler = HandlerRegistry.getInstance().getQueryHandler<GetGenreTagsQueryHandler>(
      'GetGenreTagsQuery',
    );

    const result = await handler.handle(query);

    if (!result.success) {
      ctx.status = 500;
      ctx.body = formatErrorResponse(new Error(result.error || 'Unknown error'));
      return;
    }

    ctx.status = 200;
    ctx.body = result.data;
  } catch (error) {
    ctx.status = 500;
    ctx.body = formatErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
  }
}
