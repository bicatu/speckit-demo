import { QueryHandler, QueryResult } from '../QueryHandler';
import { GetEntryByIdQuery, GetEntryByIdResult } from './GetEntryByIdQuery';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';
import { IStreamingPlatformRepository } from '../../../domain/repositories/IStreamingPlatformRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRatingRepository } from '../../../domain/repositories/IRatingRepository';

/**
 * Handler for GetEntryByIdQuery
 * Retrieves full details of a single entry
 */
export class GetEntryByIdQueryHandler
  implements QueryHandler<GetEntryByIdQuery, GetEntryByIdResult>
{
  constructor(
    private entryRepository: IEntryRepository,
    private tagRepository: IGenreTagRepository,
    private platformRepository: IStreamingPlatformRepository,
    private userRepository: IUserRepository,
    private ratingRepository: IRatingRepository,
  ) {}

  async handle(query: GetEntryByIdQuery): Promise<QueryResult<GetEntryByIdResult>> {
    try {
      const entry = await this.entryRepository.findById(query.entryId);

      if (!entry) {
        return {
          success: false,
          error: 'Entry not found',
        };
      }

      // Get associated tags
      const tags = await this.tagRepository.findByEntryId(entry.id);

      // Get platform name if exists
      let platformName: string | null = null;
      if (entry.platformId) {
        const platform = await this.platformRepository.findById(entry.platformId);
        platformName = platform?.name || null;
      }

      // Get creator info if exists
      let creator: { id: string; name: string } | null = null;
      if (entry.creatorId) {
        const user = await this.userRepository.findById(entry.creatorId);
        if (user) {
          creator = {
            id: user.id,
            name: user.name,
          };
        }
      }

      // Get rating count
      const ratingCount = await this.ratingRepository.countByEntryId(entry.id);

      return {
        success: true,
        data: {
          id: entry.id,
          title: entry.title,
          mediaType: entry.mediaType,
          platformId: entry.platformId,
          platformName,
          averageRating: entry.averageRating,
          ratingCount,
          tags: tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
          })),
          creator,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve entry details',
      };
    }
  }
}
