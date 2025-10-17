import { StreamingPlatform } from '../entities/StreamingPlatform';

/**
 * Repository interface for StreamingPlatform entity
 */
export interface IStreamingPlatformRepository {
  /**
   * Find platform by ID
   * @param id Platform UUID
   * @returns StreamingPlatform if found, null otherwise
   */
  findById(id: string): Promise<StreamingPlatform | null>;

  /**
   * Find platform by name (unique constraint)
   * @param name Platform name
   * @returns StreamingPlatform if found, null otherwise
   */
  findByName(name: string): Promise<StreamingPlatform | null>;

  /**
   * Find all platforms
   * @returns Array of all platforms
   */
  findAll(): Promise<StreamingPlatform[]>;

  /**
   * Save new platform or update existing one
   * @param platform StreamingPlatform to persist
   * @returns Saved platform
   */
  save(platform: StreamingPlatform): Promise<StreamingPlatform>;

  /**
   * Delete platform by ID
   * @param id Platform UUID
   * @returns True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;
}
