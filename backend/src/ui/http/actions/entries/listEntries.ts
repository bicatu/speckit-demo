import { Context } from 'koa';
import { v4 as uuidv4 } from 'uuid';
import { HandlerRegistry } from '../../utils/HandlerRegistry';
import { GetEntriesQuery } from '../../../application/queries/entries/GetEntriesQuery';
import { GetEntriesQueryHandler } from '../../../application/queries/entries/GetEntriesQueryHandler';
import { formatErrorResponse } from '../../utils/errors';

/**
 * GET /api/entries
 * List entries with optional filtering, sorting, and pagination
 */
export async function listEntries(ctx: Context): Promise<void> {
  try {
    const { mediaType, platformId, tagIds, sortBy, limit, offset } = ctx.query;

    // Build query
    const query: GetEntriesQuery = {
      queryId: uuidv4(),
      timestamp: new Date(),
      filters: {},
      pagination: {
        limit: limit ? parseInt(limit as string, 10) : 20,
        offset: offset ? parseInt(offset as string, 10) : 0,
      },
      sortBy: (sortBy as any) || 'recent',
    };

    if (mediaType) {
      query.filters!.mediaType = mediaType as 'film' | 'series';
    }

    if (platformId) {
      query.filters!.platformId = platformId as string;
    }

    if (tagIds) {
      const tagIdArray = Array.isArray(tagIds)
        ? tagIds
        : (tagIds as string).split(',');
      query.filters!.tagIds = tagIdArray as string[];
    }

    // Execute query
    const handler = HandlerRegistry.getQueryHandler<GetEntriesQueryHandler>('GetEntriesQuery');
    const result = await handler.handle(query);

    if (!result.success) {
      ctx.status = 500;
      ctx.body = { error: result.error };
      return;
    }

    ctx.status = 200;
    ctx.body = result.data;
  } catch (error) {
    const { error: message, statusCode } = formatErrorResponse(error as Error);
    ctx.status = statusCode;
    ctx.body = { error: message };
  }
}
