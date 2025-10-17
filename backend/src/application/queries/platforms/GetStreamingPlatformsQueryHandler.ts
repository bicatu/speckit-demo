import { QueryHandler, QueryResult } from '../QueryHandler';
import { GetStreamingPlatformsQuery, GetStreamingPlatformsResult } from './GetStreamingPlatformsQuery';
import { IStreamingPlatformRepository } from '../../../domain/repositories/IStreamingPlatformRepository';

/**
 * Handler for retrieving all streaming platforms
 */
export class GetStreamingPlatformsQueryHandler
  implements QueryHandler<GetStreamingPlatformsQuery, GetStreamingPlatformsResult>
{
  constructor(private readonly platformRepository: IStreamingPlatformRepository) {}

  async handle(_query: GetStreamingPlatformsQuery): Promise<QueryResult<GetStreamingPlatformsResult>> {
    try {
      const platforms = await this.platformRepository.findAll();

      return {
        success: true,
        data: {
          platforms: platforms.map((platform) => ({
            id: platform.id,
            name: platform.name,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve streaming platforms',
      };
    }
  }
}
