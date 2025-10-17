import { HandlerRegistry } from '../../../../src/application/HandlerRegistry';
import { CreateEntryCommand } from '../../../../src/application/commands/entries/CreateEntryCommand';
import { CreateEntryCommandHandler } from '../../../../src/application/commands/entries/CreateEntryCommandHandler';
import { GenreTag } from '../../../../src/domain/entities/GenreTag';
import DatabaseConnection from '../../../../src/infrastructure/persistence/DatabaseConnection';
import { Container } from '../../../../src/config/Container';

describe('CreateEntryCommand Integration', () => {
  let handler: CreateEntryCommandHandler;
  let dbConnection: DatabaseConnection;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize container to register all handlers
    Container.getInstance();
    
    dbConnection = DatabaseConnection.getInstance();
    handler = HandlerRegistry.getCommandHandler('CreateEntryCommand') as CreateEntryCommandHandler;
  });

  afterAll(async () => {
    // Don't close the connection in tests - it's shared
  });

  beforeEach(async () => {
    // Clean up test data
    const pool = dbConnection.getPool();
    await pool.query('DELETE FROM ratings WHERE TRUE');
    await pool.query('DELETE FROM entry_tags WHERE TRUE');
    await pool.query('DELETE FROM entries WHERE TRUE');
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test-%']);
    await pool.query('DELETE FROM genre_tags WHERE name LIKE $1', ['Test%']);

    // Create a test user with valid UUID
    const userResult = await pool.query(
      'INSERT INTO users (id, oauth_subject, email, name) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id',
      ['test-oauth-subject', 'test-integration@example.com', 'Test User']
    );
    testUserId = userResult.rows[0].id;
  });

  it('should create a new entry with tags in database', async () => {
    const pool = dbConnection.getPool();
    
    // Create test tags
    const tag1Result = await pool.query(
      'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id, name',
      ['Test Action']
    );
    const tag2Result = await pool.query(
      'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id, name',
      ['Test Sci-Fi']
    );

    const tag1 = new GenreTag({ id: tag1Result.rows[0].id, name: tag1Result.rows[0].name });
    const tag2 = new GenreTag({ id: tag2Result.rows[0].id, name: tag2Result.rows[0].name });

    const command = new CreateEntryCommand(
      testUserId,
      'Integration Test Movie',
      'film',
      [tag1.id, tag2.id],
      undefined,
      undefined
    );

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.resourceId).toBeDefined();

    // Verify entry in database
    const entryResult = await pool.query(
      'SELECT * FROM entries WHERE id = $1',
      [result.resourceId]
    );
    expect(entryResult.rows).toHaveLength(1);
    expect(entryResult.rows[0].title).toBe('Integration Test Movie');
    expect(entryResult.rows[0].media_type).toBe('film');

    // Verify tags associated
    const tagsResult = await pool.query(
      'SELECT tag_id FROM entry_tags WHERE entry_id = $1',
      [result.resourceId]
    );
    expect(tagsResult.rows).toHaveLength(2);
  });

  it('should create entry with optional rating', async () => {
    const pool = dbConnection.getPool();
    
    // Create test tag
    const tagResult = await pool.query(
      'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id, name',
      ['Test Drama']
    );
    const tag = new GenreTag({ id: tagResult.rows[0].id, name: tagResult.rows[0].name });

    const command = new CreateEntryCommand(
      testUserId,
      'Integration Test Series',
      'series',
      [tag.id],
      undefined,
      9
    );

    const result = await handler.handle(command);

    expect(result.success).toBe(true);
    expect(result.resourceId).toBeDefined();

    // Verify rating in database
    const ratingResult = await pool.query(
      'SELECT * FROM ratings WHERE entry_id = $1 AND user_id = $2',
      [result.resourceId, testUserId]
    );
    expect(ratingResult.rows).toHaveLength(1);
    expect(ratingResult.rows[0].stars).toBe(9);
  });

  it('should reject duplicate title', async () => {
    const pool = dbConnection.getPool();
    
    // Create test tag
    const tagResult = await pool.query(
      'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
      ['Test Horror']
    );
    const tagId = tagResult.rows[0].id;

    // Create first entry
    await pool.query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id) VALUES (gen_random_uuid(), $1, $2, $3, NULL)',
      ['Duplicate Title', 'film', testUserId]
    );

    const command = new CreateEntryCommand(
      testUserId,
      'Duplicate Title',
      'film',
      [tagId],
      undefined,
      undefined
    );

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Entry with this title already exists');
  });

  it('should reject invalid tag IDs', async () => {
    // Use valid UUIDs that don't exist in database
    const nonExistentTagId1 = crypto.randomUUID();
    const nonExistentTagId2 = crypto.randomUUID();

    const command = new CreateEntryCommand(
      testUserId,
      'Invalid Tags Movie',
      'film',
      [nonExistentTagId1, nonExistentTagId2],
      undefined,
      undefined
    );

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('One or more tags do not exist');
  });
});
