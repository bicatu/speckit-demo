import { Pool } from 'pg';
import DatabaseConnection from '../infrastructure/persistence/DatabaseConnection';
import { TokenCache } from '../infrastructure/external/TokenCache';
import { OAuthStateManager } from '../infrastructure/external/OAuthStateManager';

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
import { UpdateEntryCommandHandler } from '../application/commands/entries/UpdateEntryCommandHandler';
import { CreateStreamingPlatformCommandHandler } from '../application/commands/platforms/CreateStreamingPlatformCommandHandler';
import { DeleteStreamingPlatformCommandHandler } from '../application/commands/platforms/DeleteStreamingPlatformCommandHandler';
import { CreateGenreTagCommandHandler } from '../application/commands/tags/CreateGenreTagCommandHandler';
import { DeleteGenreTagCommandHandler } from '../application/commands/tags/DeleteGenreTagCommandHandler';
import { DeleteUserCommandHandler } from '../application/commands/users/DeleteUserCommandHandler';

// Handler Registry
import { HandlerRegistry } from '../application/HandlerRegistry';

/**
 * Dependency Injection Container
 * Initializes and wires together all application dependencies
 */
export class Container {
  private static instance: Container;
  private pool: Pool;

  // Authentication services
  private tokenCache: TokenCache;
  private oauthStateManager: OAuthStateManager;

  // Repository instances
  private userRepository: PostgresUserRepository;
  private entryRepository: PostgresEntryRepository;
  private genreTagRepository: PostgresGenreTagRepository;
  private streamingPlatformRepository: PostgresStreamingPlatformRepository;
  private ratingRepository: PostgresRatingRepository;

  private constructor() {
    // Get database pool
    this.pool = DatabaseConnection.getInstance().getPool();

    // Initialize authentication services
    this.tokenCache = new TokenCache(10000); // Max 10,000 entries
    this.oauthStateManager = new OAuthStateManager(600000, 1000); // 10 min TTL, max 1,000 entries

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

    // Register UpdateEntryCommandHandler
    const updateEntryHandler = new UpdateEntryCommandHandler(
      this.entryRepository,
      this.genreTagRepository,
    );
    HandlerRegistry.registerCommand('UpdateEntryCommand', updateEntryHandler);

    // Register CreateStreamingPlatformCommandHandler
    const createPlatformHandler = new CreateStreamingPlatformCommandHandler(
      this.streamingPlatformRepository,
    );
    HandlerRegistry.registerCommand('CreateStreamingPlatformCommand', createPlatformHandler);

    // Register DeleteStreamingPlatformCommandHandler
    const deletePlatformHandler = new DeleteStreamingPlatformCommandHandler(
      this.streamingPlatformRepository,
      this.entryRepository,
    );
    HandlerRegistry.registerCommand('DeleteStreamingPlatformCommand', deletePlatformHandler);

    // Register CreateGenreTagCommandHandler
    const createTagHandler = new CreateGenreTagCommandHandler(
      this.genreTagRepository,
    );
    HandlerRegistry.registerCommand('CreateGenreTagCommand', createTagHandler);

    // Register DeleteGenreTagCommandHandler
    const deleteTagHandler = new DeleteGenreTagCommandHandler(
      this.genreTagRepository,
      this.entryRepository,
    );
    HandlerRegistry.registerCommand('DeleteGenreTagCommand', deleteTagHandler);

    // Register DeleteUserCommandHandler
    const deleteUserHandler = new DeleteUserCommandHandler(
      this.userRepository,
      this.entryRepository,
    );
    HandlerRegistry.registerCommand('DeleteUserCommand', deleteUserHandler);
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

  // Getters for authentication services
  public getTokenCache(): TokenCache {
    return this.tokenCache;
  }

  public getOAuthStateManager(): OAuthStateManager {
    return this.oauthStateManager;
  }
}
