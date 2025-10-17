import { QueryHandler, QueryResult } from '../QueryHandler';
import { GetGenreTagsQuery, GetGenreTagsResult } from './GetGenreTagsQuery';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';

/**
 * Handler for retrieving all genre tags
 */
export class GetGenreTagsQueryHandler implements QueryHandler<GetGenreTagsQuery, GetGenreTagsResult> {
  constructor(private readonly tagRepository: IGenreTagRepository) {}

  async handle(_query: GetGenreTagsQuery): Promise<QueryResult<GetGenreTagsResult>> {
    try {
      const tags = await this.tagRepository.findAll();

      return {
        success: true,
        data: {
          tags: tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve genre tags',
      };
    }
  }
}
