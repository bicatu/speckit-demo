import { GenreTag } from '../entities/GenreTag';

/**
 * Repository interface for GenreTag entity
 */
export interface IGenreTagRepository {
  /**
   * Find genre tag by ID
   * @param id Tag UUID
   * @returns GenreTag if found, null otherwise
   */
  findById(id: string): Promise<GenreTag | null>;

  /**
   * Find genre tag by name (unique constraint)
   * @param name Tag name
   * @returns GenreTag if found, null otherwise
   */
  findByName(name: string): Promise<GenreTag | null>;

  /**
   * Find all genre tags
   * @returns Array of all tags
   */
  findAll(): Promise<GenreTag[]>;

  /**
   * Find multiple tags by their IDs
   * @param ids Array of tag UUIDs
   * @returns Array of found tags
   */
  findByIds(ids: string[]): Promise<GenreTag[]>;

  /**
   * Find tags associated with a specific entry
   * @param entryId Entry UUID
   * @returns Array of tags for the entry
   */
  findByEntryId(entryId: string): Promise<GenreTag[]>;

  /**
   * Save new tag or update existing one
   * @param tag GenreTag to persist
   * @returns Saved tag
   */
  save(tag: GenreTag): Promise<GenreTag>;

  /**
   * Delete tag by ID
   * @param id Tag UUID
   * @returns True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Associate tags with an entry
   * @param entryId Entry UUID
   * @param tagIds Array of tag UUIDs
   */
  associateWithEntry(entryId: string, tagIds: string[]): Promise<void>;

  /**
   * Remove all tag associations from an entry
   * @param entryId Entry UUID
   */
  removeFromEntry(entryId: string): Promise<void>;
}
