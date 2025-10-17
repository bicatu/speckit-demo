import { Context } from 'koa';
import { v4 as uuidv4 } from 'uuid';
import { HandlerRegistry } from '../../utils/HandlerRegistry';
import { GetEntryByIdQuery } from '../../../application/queries/entries/GetEntryByIdQuery';
import { GetEntryByIdQueryHandler } from '../../../application/queries/entries/GetEntryByIdQueryHandler';
import { formatErrorResponse, NotFoundError } from '../../utils/errors';

/**
 * GET /api/entries/:id
 * Get single entry by ID with full details
 */
export async function getEntryById(ctx: Context): Promise<void> {
  try {
    const { id } = ctx.params;

    if (!id) {
      ctx.status = 400;
      ctx.body = { error: 'Entry ID is required' };
      return;
    }

    // Build query
    const query: GetEntryByIdQuery = {
      queryId: uuidv4(),
      timestamp: new Date(),
      entryId: id,
    };

    // Execute query
    const handler = HandlerRegistry.getQueryHandler<GetEntryByIdQueryHandler>('GetEntryByIdQuery');
    const result = await handler.handle(query);

    if (!result.success) {
      throw new NotFoundError('Entry');
    }

    ctx.status = 200;
    ctx.body = result.data;
  } catch (error) {
    const { error: message, statusCode } = formatErrorResponse(error as Error);
    ctx.status = statusCode;
    ctx.body = { error: message };
  }
}
