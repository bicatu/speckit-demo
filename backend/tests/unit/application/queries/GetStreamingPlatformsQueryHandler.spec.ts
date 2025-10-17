import { GetStreamingPlatformsQueryHandler } from '../../../../src/application/queries/platforms/GetStreamingPlatformsQueryHandler';
import { GetStreamingPlatformsQuery } from '../../../../src/application/queries/platforms/GetStreamingPlatformsQuery';
import { IStreamingPlatformRepository } from '../../../../src/domain/repositories/IStreamingPlatformRepository';
import { StreamingPlatform } from '../../../../src/domain/entities/StreamingPlatform';

describe('GetStreamingPlatformsQueryHandler', () => {
  let handler: GetStreamingPlatformsQueryHandler;
  let mockPlatformRepository: jest.Mocked<IStreamingPlatformRepository>;

  beforeEach(() => {
    // Create mock repository
    mockPlatformRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IStreamingPlatformRepository>;

    handler = new GetStreamingPlatformsQueryHandler(mockPlatformRepository);
  });

  it('should return all streaming platforms', async () => {
    // Arrange
    const platforms = [
      new StreamingPlatform({ id: 'platform-1', name: 'Netflix' }),
      new StreamingPlatform({ id: 'platform-2', name: 'Amazon Prime' }),
      new StreamingPlatform({ id: 'platform-3', name: 'Disney+' }),
    ];

    mockPlatformRepository.findAll.mockResolvedValue(platforms);

    const query: GetStreamingPlatformsQuery = {
      queryId: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Act
    const result = await handler.handle(query);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.platforms).toHaveLength(3);
    expect(result.data!.platforms[0]).toEqual({
      id: 'platform-1',
      name: 'Netflix',
    });
    expect(result.data!.platforms[1]).toEqual({
      id: 'platform-2',
      name: 'Amazon Prime',
    });
    expect(result.data!.platforms[2]).toEqual({
      id: 'platform-3',
      name: 'Disney+',
    });
    expect(mockPlatformRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no platforms exist', async () => {
    // Arrange
    mockPlatformRepository.findAll.mockResolvedValue([]);

    const query: GetStreamingPlatformsQuery = {
      queryId: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Act
    const result = await handler.handle(query);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.platforms).toHaveLength(0);
    expect(mockPlatformRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return error when repository throws exception', async () => {
    // Arrange
    mockPlatformRepository.findAll.mockRejectedValue(new Error('Database connection failed'));

    const query: GetStreamingPlatformsQuery = {
      queryId: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Act
    const result = await handler.handle(query);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection failed');
    expect(mockPlatformRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return generic error message for non-Error exceptions', async () => {
    // Arrange
    mockPlatformRepository.findAll.mockRejectedValue('Unknown error');

    const query: GetStreamingPlatformsQuery = {
      queryId: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Act
    const result = await handler.handle(query);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to retrieve streaming platforms');
    expect(mockPlatformRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
