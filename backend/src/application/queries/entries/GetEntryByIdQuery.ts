import { Query } from '../Query';

/**
 * Query to get a single entry by ID with full details
 * Part of User Story 1: Browse and Discover Content
 */
export interface GetEntryByIdQuery extends Query<GetEntryByIdResult> {
  entryId: string;
}

/**
 * Result type for GetEntryByIdQuery
 */
export interface GetEntryByIdResult {
  id: string;
  title: string;
  mediaType: 'film' | 'series';
  platformId: string | null;
  platformName: string | null;
  averageRating: number | null;
  ratingCount: number;
  tags: Array<{
    id: string;
    name: string;
  }>;
  creator: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}
