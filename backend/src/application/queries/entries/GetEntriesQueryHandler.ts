import { QueryHandler, QueryResult } from '../QueryHandler';
import { GetEntriesQuery, GetEntriesResult } from './GetEntriesQuery';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';
import { IStreamingPlatformRepository } from '../../../domain/repositories/IStreamingPlatformRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

/**
 * Handler for GetEntriesQuery
 * Retrieves entries with filtering, sorting, and pagination
 */
export class GetEntriesQueryHandler
  implements QueryHandler<GetEntriesQuery, GetEntriesResult>
{
  constructor(
    private entryRepository: IEntryRepository,
    private tagRepository: IGenreTagRepository,
    private platformRepository: IStreamingPlatformRepository,
    private userRepository: IUserRepository,
  ) {}

  async handle(query: GetEntriesQuery): Promise<QueryResult<GetEntriesResult>> {
    try {
      const limit = query.pagination?.limit || 20;
      const offset = query.pagination?.offset || 0;

      // If newToMe filter is active, retrieve user's lastLogin
      let userLastLogin: Date | undefined;
      if (query.filters?.newToMe && query.filters?.userId) {
        const user = await this.userRepository.findById(query.filters.userId);
        if (user && user.lastLogin) {
          userLastLogin = user.lastLogin;
        }
      }

      // Build filters with userLastLogin if needed
      const filters = {
        ...query.filters,
        userLastLogin,
      };

      // Get entries based on sorting preference
      let entries;
      if (query.sortBy === 'topRated') {
        entries = await this.entryRepository.findTopRated(limit);
      } else if (query.sortBy === 'recent') {
        entries = await this.entryRepository.findRecent(limit);
      } else {
        entries = await this.entryRepository.findAll(filters, limit, offset);
      }

      // Get total count for pagination
      const total = await this.entryRepository.count(filters);

      // Enrich entries with tags and platform names
      const enrichedEntries = await Promise.all(
        entries.map(async (entry) => {
          const tags = await this.tagRepository.findByEntryId(entry.id);
          let platformName: string | null = null;

          if (entry.platformId) {
            const platform = await this.platformRepository.findById(entry.platformId);
            platformName = platform?.name || null;
          }

          return {
            id: entry.id,
            title: entry.title,
            mediaType: entry.mediaType,
            platformId: entry.platformId,
            platformName,
            averageRating: entry.averageRating,
            tags: tags.map((tag) => ({
              id: tag.id,
              name: tag.name,
            })),
            createdAt: entry.createdAt.toISOString(),
          };
        }),
      );

      return {
        success: true,
        data: {
          entries: enrichedEntries,
          total,
          limit,
          offset,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve entries',
      };
    }
  }
}
