import { GetEntriesQueryHandler } from '../../../../src/application/queries/entries/GetEntriesQueryHandler';
import { GetEntriesQuery } from '../../../../src/application/queries/entries/GetEntriesQuery';
import { IEntryRepository } from '../../../../src/domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../../src/domain/repositories/IGenreTagRepository';
import { IStreamingPlatformRepository } from '../../../../src/domain/repositories/IStreamingPlatformRepository';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { Entry } from '../../../../src/domain/entities/Entry';
import { GenreTag } from '../../../../src/domain/entities/GenreTag';
import { StreamingPlatform } from '../../../../src/domain/entities/StreamingPlatform';
import { User } from '../../../../src/domain/entities/User';

describe('GetEntriesQueryHandler', () => {
  let handler: GetEntriesQueryHandler;
  let mockEntryRepository: jest.Mocked<IEntryRepository>;
  let mockTagRepository: jest.Mocked<IGenreTagRepository>;
  let mockPlatformRepository: jest.Mocked<IStreamingPlatformRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockEntryRepository = {
      findAll: jest.fn(),
      findTopRated: jest.fn(),
      findRecent: jest.fn(),
      findById: jest.fn(),
      findByTitle: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateTags: jest.fn(),
      findByCreatorId: jest.fn(),
      anonymizeCreator: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<IEntryRepository>;

    mockTagRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findByEntryId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      associateWithEntry: jest.fn(),
      removeFromEntry: jest.fn(),
    } as jest.Mocked<IGenreTagRepository>;

    mockPlatformRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IStreamingPlatformRepository>;

    mockUserRepository = {
      findById: jest.fn(),
      findByOAuthSubject: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByOAuthSubject: jest.fn(),
      countAdmins: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    handler = new GetEntriesQueryHandler(
      mockEntryRepository,
      mockTagRepository,
      mockPlatformRepository,
      mockUserRepository
    );
  });

  describe('Basic Filtering and Sorting', () => {
    it('should return entries with default pagination', async () => {
      const mockEntries = [
        new Entry({
          id: 'entry-1',
          title: 'Test Movie',
          mediaType: 'film',
          creatorId: 'user-1',
          platformId: 'platform-1',
          averageRating: 8.5,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        }),
      ];

      const mockTags = [
        new GenreTag({ id: 'tag-1', name: 'Action' }),
      ];

      const mockPlatform = new StreamingPlatform({
        id: 'platform-1',
        name: 'Netflix',
      });

      mockEntryRepository.findAll.mockResolvedValue(mockEntries);
      mockEntryRepository.count.mockResolvedValue(1);
      mockTagRepository.findByEntryId.mockResolvedValue(mockTags);
      mockPlatformRepository.findById.mockResolvedValue(mockPlatform);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.entries).toHaveLength(1);
      expect(result.data!.entries[0].title).toBe('Test Movie');
      expect(result.data!.entries[0].platformName).toBe('Netflix');
      expect(result.data!.limit).toBe(20);
      expect(result.data!.offset).toBe(0);
    });

    it('should return top rated entries when sortBy is topRated', async () => {
      const mockEntries = [
        new Entry({
          id: 'entry-1',
          title: 'Top Rated Movie',
          mediaType: 'film',
          creatorId: 'user-1',
          platformId: null,
          averageRating: 9.5,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        }),
      ];

      mockEntryRepository.findTopRated.mockResolvedValue(mockEntries);
      mockEntryRepository.count.mockResolvedValue(1);
      mockTagRepository.findByEntryId.mockResolvedValue([]);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        sortBy: 'topRated',
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(true);
      expect(mockEntryRepository.findTopRated).toHaveBeenCalledWith(20);
      expect(result.data!.entries[0].title).toBe('Top Rated Movie');
    });

    it('should return recent entries when sortBy is recent', async () => {
      const mockEntries = [
        new Entry({
          id: 'entry-1',
          title: 'Recent Movie',
          mediaType: 'film',
          creatorId: 'user-1',
          platformId: null,
          averageRating: null,
          createdAt: new Date('2025-10-01'),
          updatedAt: new Date('2025-10-01'),
        }),
      ];

      mockEntryRepository.findRecent.mockResolvedValue(mockEntries);
      mockEntryRepository.count.mockResolvedValue(1);
      mockTagRepository.findByEntryId.mockResolvedValue([]);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        sortBy: 'recent',
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(true);
      expect(mockEntryRepository.findRecent).toHaveBeenCalledWith(20);
      expect(result.data!.entries[0].title).toBe('Recent Movie');
    });

    it('should apply filters correctly', async () => {
      mockEntryRepository.findAll.mockResolvedValue([]);
      mockEntryRepository.count.mockResolvedValue(0);

      const filters = {
        mediaType: 'film' as const,
        platformId: 'platform-1',
        tagIds: ['tag-1', 'tag-2'],
      };

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters,
      };

      await handler.handle(query);

      expect(mockEntryRepository.findAll).toHaveBeenCalledWith(filters, 20, 0);
      expect(mockEntryRepository.count).toHaveBeenCalledWith(filters);
    });

    it('should handle custom pagination', async () => {
      mockEntryRepository.findAll.mockResolvedValue([]);
      mockEntryRepository.count.mockResolvedValue(100);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        pagination: {
          limit: 10,
          offset: 20,
        },
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data!.limit).toBe(10);
      expect(result.data!.offset).toBe(20);
      expect(mockEntryRepository.findAll).toHaveBeenCalledWith({userLastLogin: undefined}, 10, 20);
    });
  });

  describe('New To Me Filter (User Story 4)', () => {
    it('should filter entries created after user last login when newToMe is true', async () => {
      const userId = 'test-user-1';
      const userLastLogin = new Date('2025-10-01T00:00:00Z');

      const mockEntries = [
        new Entry({
          id: 'entry-1',
          title: 'New Movie',
          mediaType: 'film',
          creatorId: 'user-2',
          platformId: null,
          averageRating: null,
          createdAt: new Date('2025-10-15T00:00:00Z'),
          updatedAt: new Date('2025-10-15T00:00:00Z'),
        }),
      ];

      const mockUser = new User({
        id: userId,
        oauthSubject: 'oauth-123',
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: false,
        lastLogin: userLastLogin,
        createdAt: new Date(),
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findAll.mockResolvedValue(mockEntries);
      mockEntryRepository.count.mockResolvedValue(1);
      mockTagRepository.findByEntryId.mockResolvedValue([]);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          newToMe: true,
          userId,
        },
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(true);
      expect(mockEntryRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          newToMe: true,
          userLastLogin,
        }),
        20,
        0
      );
      expect(result.data!.entries).toHaveLength(1);
      expect(result.data!.entries[0].title).toBe('New Movie');
    });

    it('should filter entries updated after user last login when newToMe is true', async () => {
      const userId = 'test-user-1';
      const userLastLogin = new Date('2025-10-01T00:00:00Z');

      const mockEntries = [
        new Entry({
          id: 'entry-1',
          title: 'Updated Movie',
          mediaType: 'film',
          creatorId: 'user-2',
          platformId: null,
          averageRating: null,
          createdAt: new Date('2025-09-01T00:00:00Z'),
          updatedAt: new Date('2025-10-15T00:00:00Z'),
        }),
      ];

      const mockUser = new User({
        id: userId,
        oauthSubject: 'oauth-123',
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: false,
        lastLogin: userLastLogin,
        createdAt: new Date(),
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findAll.mockResolvedValue(mockEntries);
      mockEntryRepository.count.mockResolvedValue(1);
      mockTagRepository.findByEntryId.mockResolvedValue([]);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          newToMe: true,
          userId,
        },
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data!.entries).toHaveLength(1);
      expect(result.data!.entries[0].title).toBe('Updated Movie');
    });

    it('should not filter when newToMe is false or undefined', async () => {
      mockEntryRepository.findAll.mockResolvedValue([]);
      mockEntryRepository.count.mockResolvedValue(0);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          newToMe: false,
        },
      };

      await handler.handle(query);

      expect(mockEntryRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          newToMe: false,
        }),
        20,
        0
      );
    });

    it('should combine newToMe filter with other filters', async () => {
      const userId = 'test-user-1';
      const userLastLogin = new Date('2025-10-01T00:00:00Z');

      const mockEntries = [
        new Entry({
          id: 'entry-1',
          title: 'New Action Film',
          mediaType: 'film',
          creatorId: 'user-2',
          platformId: null,
          averageRating: null,
          createdAt: new Date('2025-10-15T00:00:00Z'),
          updatedAt: new Date('2025-10-15T00:00:00Z'),
        }),
      ];

      const mockUser = new User({
        id: userId,
        oauthSubject: 'oauth-123',
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: false,
        lastLogin: userLastLogin,
        createdAt: new Date(),
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.findAll.mockResolvedValue(mockEntries);
      mockEntryRepository.count.mockResolvedValue(1);
      mockTagRepository.findByEntryId.mockResolvedValue([]);

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          mediaType: 'film',
          tagIds: ['tag-1'],
          newToMe: true,
          userId,
        },
      };

      await handler.handle(query);

      expect(mockEntryRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaType: 'film',
          tagIds: ['tag-1'],
          newToMe: true,
          userLastLogin,
        }),
        20,
        0
      );
    });
  });

  describe('Error Handling', () => {
    it('should return error when repository throws exception', async () => {
      mockEntryRepository.findAll.mockRejectedValue(new Error('Database error'));

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should return generic error for non-Error exceptions', async () => {
      mockEntryRepository.findAll.mockRejectedValue('Unknown error');

      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
      };

      const result = await handler.handle(query);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve entries');
    });
  });
});
