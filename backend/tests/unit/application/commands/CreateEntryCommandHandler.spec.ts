import { CreateEntryCommandHandler } from '../../../../src/application/commands/entries/CreateEntryCommandHandler';
import { CreateEntryCommand } from '../../../../src/application/commands/entries/CreateEntryCommand';
import { IEntryRepository } from '../../../../src/domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../../src/domain/repositories/IGenreTagRepository';
import { IRatingRepository } from '../../../../src/domain/repositories/IRatingRepository';
import { Entry } from '../../../../src/domain/entities/Entry';
import { GenreTag } from '../../../../src/domain/entities/GenreTag';

describe('CreateEntryCommandHandler', () => {
  let handler: CreateEntryCommandHandler;
  let mockEntryRepository: jest.Mocked<IEntryRepository>;
  let mockGenreTagRepository: jest.Mocked<IGenreTagRepository>;
  let mockRatingRepository: jest.Mocked<IRatingRepository>;

  beforeEach(() => {
    mockEntryRepository = {
      findById: jest.fn(),
      findByTitle: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findTopRated: jest.fn(),
      findRecent: jest.fn(),
    } as jest.Mocked<IEntryRepository>;

    mockGenreTagRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findByIds: jest.fn(),
      findByEntryId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      associateWithEntry: jest.fn(),
      removeFromEntry: jest.fn(),
    } as jest.Mocked<IGenreTagRepository>;

    mockRatingRepository = {
      findByUserAndEntry: jest.fn(),
      findByEntryId: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      calculateAverageForEntry: jest.fn(),
      countByEntryId: jest.fn(),
    } as jest.Mocked<IRatingRepository>;

    handler = new CreateEntryCommandHandler(
      mockEntryRepository,
      mockGenreTagRepository,
      mockRatingRepository
    );
  });

  it('should create a new entry with valid data', async () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['tag-1', 'tag-2'],
      'netflix',
      8
    );

    const mockTags = [
      new GenreTag({ id: 'tag-1', name: 'Sci-Fi' }),
      new GenreTag({ id: 'tag-2', name: 'Action' })
    ];

    mockEntryRepository.findByTitle.mockResolvedValue(null);
    mockGenreTagRepository.findByIds.mockResolvedValue(mockTags);
    mockEntryRepository.save.mockImplementation((entry) => Promise.resolve(entry));

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect(mockEntryRepository.findByTitle).toHaveBeenCalledWith('The Matrix');
    expect(mockEntryRepository.save).toHaveBeenCalled();
  });

  it('should throw error if title already exists', async () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['tag-1'],
      undefined,
      undefined
    );

    const existingEntry = new Entry({
      id: 'entry-1',
      title: 'The Matrix',
      mediaType: 'film',
      creatorId: 'user-123',
      platformId: null,
      averageRating: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockEntryRepository.findByTitle.mockResolvedValue(existingEntry);

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Entry with this title already exists');
  });

  it('should throw error if any tag does not exist', async () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['tag-1', 'tag-2'],
      undefined,
      undefined
    );

    mockEntryRepository.findByTitle.mockResolvedValue(null);
    mockGenreTagRepository.findByIds.mockResolvedValue([
      new GenreTag({ id: 'tag-1', name: 'Sci-Fi' })
    ]);

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('One or more tags do not exist');
  });

  it('should create rating if initial rating provided', async () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['tag-1'],
      undefined,
      8
    );

    const mockTags = [new GenreTag({ id: 'tag-1', name: 'Sci-Fi' })];

    mockEntryRepository.findByTitle.mockResolvedValue(null);
    mockGenreTagRepository.findByIds.mockResolvedValue(mockTags);
    mockEntryRepository.save.mockImplementation((entry) => Promise.resolve(entry));
    mockRatingRepository.save.mockImplementation((rating) => Promise.resolve(rating));

    await handler.handle(command);

    expect(mockRatingRepository.save).toHaveBeenCalled();
  });

  it('should not create rating if initial rating not provided', async () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['tag-1'],
      undefined,
      undefined
    );

    const mockTags = [new GenreTag({ id: 'tag-1', name: 'Sci-Fi' })];

    mockEntryRepository.findByTitle.mockResolvedValue(null);
    mockGenreTagRepository.findByIds.mockResolvedValue(mockTags);
    mockEntryRepository.save.mockImplementation((entry) => Promise.resolve(entry));

    await handler.handle(command);

    expect(mockRatingRepository.save).not.toHaveBeenCalled();
  });
});
