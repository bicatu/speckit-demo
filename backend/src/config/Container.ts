import { Pool } from 'pg';
import DatabaseConnection from '../infrastructure/persistence/DatabaseConnection';

// Repositories
import { PostgresUserRepository } from '../infrastructure/domain/PostgresUserRepository';
import { PostgresEntryRepository } from '../infrastructure/domain/PostgresEntryRepository';
import { PostgresGenreTagRepository } from '../infrastructure/domain/PostgresGenreTagRepository';
import { PostgresStreamingPlatformRepository } from '../infrastructure/domain/PostgresStreamingPlatformRepository';
import { PostgresRatingRepository } from '../infrastructure/domain/PostgresRatingRepository';

// Query Handlers
import { GetEntriesQueryHandler } from '../application/queries/entries/GetEntriesQueryHandler';
import { GetEntryByIdQueryHandler } from '../application/queries/entries/GetEntryByIdQueryHandler';
import { GetGenreTagsQueryHandler } from '../application/queries/tags/GetGenreTagsQueryHandler';
import { GetStreamingPlatformsQueryHandler } from '../application/queries/platforms/GetStreamingPlatformsQueryHandler';

// Command Handlers
import { AddRatingCommandHandler } from '../application/commands/ratings/AddRatingCommandHandler';
import { UpdateRatingCommandHandler } from '../application/commands/ratings/UpdateRatingCommandHandler';
import { CreateEntryCommandHandler } from '../application/commands/entries/CreateEntryCommandHandler';

// Handler Registry
import { HandlerRegistry } from '../application/HandlerRegistry';

/**
 * Dependency Injection Container
 * Initializes and wires together all application dependencies
 */
export class Container {
  private static instance: Container;
  private pool: Pool;

  // Repository instances
  private userRepository: PostgresUserRepository;
  private entryRepository: PostgresEntryRepository;
  private genreTagRepository: PostgresGenreTagRepository;
  private streamingPlatformRepository: PostgresStreamingPlatformRepository;
  private ratingRepository: PostgresRatingRepository;

  private constructor() {
    // Get database pool
    this.pool = DatabaseConnection.getInstance().getPool();

    // Initialize repositories
    this.userRepository = new PostgresUserRepository(this.pool);
    this.entryRepository = new PostgresEntryRepository(this.pool);
    this.genreTagRepository = new PostgresGenreTagRepository(this.pool);
    this.streamingPlatformRepository = new PostgresStreamingPlatformRepository(this.pool);
    this.ratingRepository = new PostgresRatingRepository(this.pool);

    // Register query handlers
    this.registerQueryHandlers();
    
    // Register command handlers
    this.registerCommandHandlers();
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private registerQueryHandlers(): void {
    // Register GetEntriesQueryHandler
    const getEntriesHandler = new GetEntriesQueryHandler(
      this.entryRepository,
      this.genreTagRepository,
      this.streamingPlatformRepository,
      this.userRepository,
    );
    HandlerRegistry.registerQuery('GetEntriesQuery', getEntriesHandler);

    // Register GetEntryByIdQueryHandler
    const getEntryByIdHandler = new GetEntryByIdQueryHandler(
      this.entryRepository,
      this.genreTagRepository,
      this.streamingPlatformRepository,
      this.userRepository,
      this.ratingRepository,
    );
    HandlerRegistry.registerQuery('GetEntryByIdQuery', getEntryByIdHandler);

    // Register GetGenreTagsQueryHandler
    const getGenreTagsHandler = new GetGenreTagsQueryHandler(this.genreTagRepository);
    HandlerRegistry.registerQuery('GetGenreTagsQuery', getGenreTagsHandler);

    // Register GetStreamingPlatformsQueryHandler
    const getStreamingPlatformsHandler = new GetStreamingPlatformsQueryHandler(
      this.streamingPlatformRepository,
    );
    HandlerRegistry.registerQuery(
      'GetStreamingPlatformsQuery',
      getStreamingPlatformsHandler,
    );
  }

  private registerCommandHandlers(): void {
    // Register AddRatingCommandHandler
    const addRatingHandler = new AddRatingCommandHandler(
      this.ratingRepository,
      this.entryRepository,
    );
    HandlerRegistry.registerCommand('AddRatingCommand', addRatingHandler);

    // Register UpdateRatingCommandHandler
    const updateRatingHandler = new UpdateRatingCommandHandler(
      this.ratingRepository,
      this.entryRepository,
    );
    HandlerRegistry.registerCommand('UpdateRatingCommand', updateRatingHandler);

    // Register CreateEntryCommandHandler
    const createEntryHandler = new CreateEntryCommandHandler(
      this.entryRepository,
      this.genreTagRepository,
      this.ratingRepository,
    );
    HandlerRegistry.registerCommand('CreateEntryCommand', createEntryHandler);
  }

  // Getters for repositories (if needed elsewhere)
  public getUserRepository(): PostgresUserRepository {
    return this.userRepository;
  }

  public getEntryRepository(): PostgresEntryRepository {
    return this.entryRepository;
  }

  public getGenreTagRepository(): PostgresGenreTagRepository {
    return this.genreTagRepository;
  }

  public getStreamingPlatformRepository(): PostgresStreamingPlatformRepository {
    return this.streamingPlatformRepository;
  }

  public getRatingRepository(): PostgresRatingRepository {
    return this.ratingRepository;
  }
}
