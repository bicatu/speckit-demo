import { Entry } from '../entities/Entry';

/**
 * Repository interface for Entry aggregate
 * Defines contract for persistence operations
 */
export interface IEntryRepository {
  /**
   * Find entry by ID
   * @param id Entry UUID
   * @returns Entry if found, null otherwise
   */
  findById(id: string): Promise<Entry | null>;

  /**
   * Find entry by title (unique constraint)
   * @param title Entry title
   * @returns Entry if found, null otherwise
   */
  findByTitle(title: string): Promise<Entry | null>;

  /**
   * Find all entries with optional filtering
   * @param filters Optional filters for mediaType, platformId, tagIds, newToMe, userLastLogin
   * @param limit Maximum number of results
   * @param offset Pagination offset
   * @returns Array of entries matching criteria
   */
  findAll(filters?: {
    mediaType?: 'film' | 'series';
    platformId?: string;
    tagIds?: string[];
    newToMe?: boolean;
    userLastLogin?: Date;
  }, limit?: number, offset?: number): Promise<Entry[]>;

  /**
   * Save new entry or update existing one
   * @param entry Entry to persist
   * @returns Saved entry
   */
  save(entry: Entry): Promise<Entry>;

  /**
   * Update existing entry
   * @param entry Entry with updated data
   * @returns void
   */
  update(entry: Entry): Promise<void>;

  /**
   * Update entry tags
   * @param entryId Entry UUID
   * @param tagIds Array of tag UUIDs
   * @returns void
   */
  updateTags(entryId: string, tagIds: string[]): Promise<void>;

  /**
   * Delete entry by ID
   * @param id Entry UUID
   * @returns True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count total entries with optional filtering
   * @param filters Optional filters
   * @returns Total count
   */
  count(filters?: {
    mediaType?: 'film' | 'series';
    platformId?: string;
    tagIds?: string[];
    newToMe?: boolean;
    userLastLogin?: Date;
  }): Promise<number>;

  /**
   * Get entries ordered by average rating (descending)
   * @param limit Maximum number of results
   * @returns Array of top-rated entries
   */
  findTopRated(limit: number): Promise<Entry[]>;

  /**
   * Get most recently created entries
   * @param limit Maximum number of results
   * @returns Array of recent entries
   */
  findRecent(limit: number): Promise<Entry[]>;

  /**
   * Find all entries created by a specific user
   * @param creatorId User UUID
   * @returns Array of entries created by the user
   */
  findByCreatorId(creatorId: string): Promise<Entry[]>;

  /**
   * Anonymize creator for an entry (set creator_id to NULL)
   * Used when a user account is deleted
   * @param entryId Entry UUID
   * @returns void
   */
  anonymizeCreator(entryId: string): Promise<void>;
}
