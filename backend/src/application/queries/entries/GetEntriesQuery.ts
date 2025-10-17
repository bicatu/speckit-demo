import { Query } from '../Query';

/**
 * Query to get entries with optional filtering and pagination
 * Part of User Story 1: Browse and Discover Content
 */
export interface GetEntriesQuery extends Query<GetEntriesResult> {
  filters?: {
    mediaType?: 'film' | 'series';
    platformId?: string;
    tagIds?: string[];
  };
  pagination?: {
    limit: number;
    offset: number;
  };
  sortBy?: 'recent' | 'topRated' | 'title';
}

/**
 * Result type for GetEntriesQuery
 */
export interface GetEntriesResult {
  entries: Array<{
    id: string;
    title: string;
    mediaType: 'film' | 'series';
    platformId: string | null;
    platformName: string | null;
    averageRating: number | null;
    tags: Array<{
      id: string;
      name: string;
    }>;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}
