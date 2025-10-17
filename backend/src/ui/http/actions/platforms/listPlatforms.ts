import { Context } from 'koa';
import { v4 as uuidv4 } from 'uuid';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';
import { GetStreamingPlatformsQuery } from '../../../../application/queries/platforms/GetStreamingPlatformsQuery';
import { GetStreamingPlatformsQueryHandler } from '../../../../application/queries/platforms/GetStreamingPlatformsQueryHandler';
import { formatErrorResponse } from '../../utils/errors';

/**
 * GET /api/platforms - List all streaming platforms
 */
export async function listPlatforms(ctx: Context): Promise<void> {
  try {
    const query: GetStreamingPlatformsQuery = {
      queryId: uuidv4(),
      timestamp: new Date(),
    };

    const handler = HandlerRegistry.getQueryHandler<GetStreamingPlatformsQueryHandler>(
      'GetStreamingPlatformsQuery',
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
