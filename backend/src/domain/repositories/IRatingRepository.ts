import { Rating } from '../entities/Rating';

/**
 * Repository interface for Rating entity
 */
export interface IRatingRepository {
  /**
   * Find rating by user and entry (composite key)
   * @param userId User UUID
   * @param entryId Entry UUID
   * @returns Rating if found, null otherwise
   */
  findByUserAndEntry(userId: string, entryId: string): Promise<Rating | null>;

  /**
   * Find all ratings for a specific entry
   * @param entryId Entry UUID
   * @returns Array of ratings for the entry
   */
  findByEntryId(entryId: string): Promise<Rating[]>;

  /**
   * Find all ratings by a specific user
   * @param userId User UUID
   * @returns Array of ratings by the user
   */
  findByUserId(userId: string): Promise<Rating[]>;

  /**
   * Save new rating or update existing one
   * @param rating Rating to persist
   * @returns Saved rating
   */
  save(rating: Rating): Promise<Rating>;

  /**
   * Delete rating
   * @param userId User UUID
   * @param entryId Entry UUID
   * @returns True if deleted, false if not found
   */
  delete(userId: string, entryId: string): Promise<boolean>;

  /**
   * Calculate average rating for an entry
   * @param entryId Entry UUID
   * @returns Average rating (1-10) or null if no ratings
   */
  calculateAverageForEntry(entryId: string): Promise<number | null>;

  /**
   * Count total ratings for an entry
   * @param entryId Entry UUID
   * @returns Number of ratings
   */
  countByEntryId(entryId: string): Promise<number>;
}
