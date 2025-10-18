import { User } from '../entities/User';

/**
 * Repository interface for User entity
 */
export interface IUserRepository {
  /**
   * Find user by ID
   * @param id User UUID
   * @returns User if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by OAuth subject (unique constraint)
   * @param oauthSubject OAuth provider subject identifier
   * @returns User if found, null otherwise
   */
  findByOAuthSubject(oauthSubject: string): Promise<User | null>;

  /**
   * Find user by email
   * @param email User email address
   * @returns User if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find all users with optional admin filter
   * @param isAdmin Optional filter for admin status
   * @returns Array of users
   */
  findAll(isAdmin?: boolean): Promise<User[]>;

  /**
   * Save new user or update existing one
   * @param user User to persist
   * @returns Saved user
   */
  save(user: User): Promise<User>;

  /**
   * Delete user by ID
   * @param id User UUID
   * @returns True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if user exists by OAuth subject
   * @param oauthSubject OAuth provider subject identifier
   * @returns True if user exists
   */
  existsByOAuthSubject(oauthSubject: string): Promise<boolean>;

  /**
   * Count total number of admin users
   * @returns Number of admin users
   */
  countAdmins(): Promise<number>;
}
