import { DeleteUserCommand } from '../../../../src/application/commands/users/DeleteUserCommand';
import { DeleteUserCommandHandler } from '../../../../src/application/commands/users/DeleteUserCommandHandler';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { IEntryRepository } from '../../../../src/domain/repositories/IEntryRepository';
import { IRatingRepository } from '../../../../src/domain/repositories/IRatingRepository';
import { User } from '../../../../src/domain/entities/User';
import { Entry } from '../../../../src/domain/entities/Entry';
import { Rating } from '../../../../src/domain/entities/Rating';

describe('DeleteUserCommand Integration', () => {
  let userRepository: IUserRepository;
  let entryRepository: IEntryRepository;
  let ratingRepository: IRatingRepository;
  let handler: DeleteUserCommandHandler;
  let testUser: User;
  let adminUser: User;
  let entryByUser: Entry;
  let ratingByUser: Rating;

  beforeEach(async () => {
    // Setup repositories with actual database connection
    // This will be implemented with actual PostgreSQL connection
    
    // Create test users
    testUser = new User(
      crypto.randomUUID(),
      'test-oauth-subject',
      'test@example.com',
      'Test User',
      false,
      null,
      new Date()
    );
    
    adminUser = new User(
      crypto.randomUUID(),
      'admin-oauth-subject',
      'admin@example.com',
      'Admin User',
      true,
      null,
      new Date()
    );

    await userRepository.save(testUser);
    await userRepository.save(adminUser);

    // Create entry by test user
    entryByUser = new Entry(
      crypto.randomUUID(),
      'Test Movie',
      'film',
      testUser.id,
      null,
      null,
      new Date(),
      new Date()
    );
    await entryRepository.save(entryByUser);

    // Create rating by test user
    ratingByUser = new Rating(
      testUser.id,
      entryByUser.id,
      8,
      new Date(),
      new Date()
    );
    await ratingRepository.save(ratingByUser);

    handler = new DeleteUserCommandHandler(userRepository, entryRepository, ratingRepository);
  });

  afterEach(async () => {
    // Cleanup test data
    await ratingRepository.delete(testUser.id, entryByUser.id);
    await entryRepository.delete(entryByUser.id);
    await userRepository.delete(testUser.id);
    await userRepository.delete(adminUser.id);
  });

  describe('user anonymization (FR-019)', () => {
    it('should preserve entries with creator_id set to NULL when user is deleted', async () => {
      const command = new DeleteUserCommand(testUser.id);
      await handler.handle(command);

      // Verify user is deleted
      const deletedUser = await userRepository.findById(testUser.id);
      expect(deletedUser).toBeNull();

      // Verify entry still exists
      const entry = await entryRepository.findById(entryByUser.id);
      expect(entry).not.toBeNull();
      
      // Verify creator_id is anonymized (NULL or sentinel)
      expect(entry!.creatorId).toBeNull();
    });

    it('should preserve ratings when user is deleted', async () => {
      const command = new DeleteUserCommand(testUser.id);
      await handler.handle(command);

      // Verify user is deleted
      const deletedUser = await userRepository.findById(testUser.id);
      expect(deletedUser).toBeNull();

      // Verify rating still exists (database ON DELETE SET NULL handles this)
      const ratings = await ratingRepository.findByEntryId(entryByUser.id);
      expect(ratings.length).toBeGreaterThan(0);
      
      // Verify user_id is set to NULL
      const rating = ratings.find(r => r.entryId === entryByUser.id);
      expect(rating).toBeDefined();
      expect(rating!.userId).toBeNull();
    });

    it('should delete all user data including OAuth subject and email', async () => {
      const command = new DeleteUserCommand(testUser.id);
      await handler.handle(command);

      // Verify user is completely removed
      const deletedUser = await userRepository.findById(testUser.id);
      expect(deletedUser).toBeNull();

      // Verify cannot find by OAuth subject
      const userByOAuth = await userRepository.findByOAuthSubject(testUser.oauthSubject);
      expect(userByOAuth).toBeNull();
    });
  });

  describe('admin protection', () => {
    it('should prevent deletion of last admin user', async () => {
      // Delete all admins except one
      const command = new DeleteUserCommand(adminUser.id);
      
      // This should throw an error
      await expect(handler.handle(command)).rejects.toThrow(
        'Cannot delete the last admin user'
      );

      // Verify admin user still exists
      const user = await userRepository.findById(adminUser.id);
      expect(user).not.toBeNull();
    });

    it('should allow deletion of admin when other admins exist', async () => {
      // Create another admin
      const anotherAdmin = new User(
        crypto.randomUUID(),
        'admin2-oauth-subject',
        'admin2@example.com',
        'Admin User 2',
        true,
        null,
        new Date()
      );
      await userRepository.save(anotherAdmin);

      const command = new DeleteUserCommand(adminUser.id);
      await handler.handle(command);

      // Verify user is deleted
      const deletedUser = await userRepository.findById(adminUser.id);
      expect(deletedUser).toBeNull();

      // Cleanup
      await userRepository.delete(anotherAdmin.id);
    });
  });

  describe('error handling', () => {
    it('should throw error when user does not exist', async () => {
      const nonExistentId = crypto.randomUUID();
      const command = new DeleteUserCommand(nonExistentId);

      await expect(handler.handle(command)).rejects.toThrow('User not found');
    });

    it('should throw error for invalid user ID', async () => {
      const command = new DeleteUserCommand('invalid-uuid');

      await expect(handler.handle(command)).rejects.toThrow();
    });
  });
});
