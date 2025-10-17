import { Query } from '../Query';

/**
 * Query to retrieve all genre tags for filtering
 */
export interface GetGenreTagsQuery extends Query<GetGenreTagsResult> {
  // No filters needed - return all tags
}

export interface GenreTagDto {
  id: string;
  name: string;
}

export interface GetGenreTagsResult {
  tags: GenreTagDto[];
}
