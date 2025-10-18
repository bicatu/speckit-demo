import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { UpdateEntryCommand } from '../../../../src/application/commands/entries/UpdateEntryCommand';
import { UpdateEntryCommandHandler } from '../../../../src/application/commands/entries/UpdateEntryCommandHandler';
import { CreateEntryCommand } from '../../../../src/application/commands/entries/CreateEntryCommand';
import { CreateEntryCommandHandler } from '../../../../src/application/commands/entries/CreateEntryCommandHandler';
import { PostgresEntryRepository } from '../../../../src/infrastructure/domain/PostgresEntryRepository';
import { PostgresGenreTagRepository } from '../../../../src/infrastructure/domain/PostgresGenreTagRepository';
import { PostgresRatingRepository } from '../../../../src/infrastructure/domain/PostgresRatingRepository';
import DatabaseConnection from '../../../../src/infrastructure/persistence/DatabaseConnection';

describe('UpdateEntryCommand Integration', () => {
  let dbConnection: DatabaseConnection;
  let entryRepository: PostgresEntryRepository;
  let genreTagRepository: PostgresGenreTagRepository;
  let ratingRepository: PostgresRatingRepository;
  let updateHandler: UpdateEntryCommandHandler;
  let createHandler: CreateEntryCommandHandler;
  let userId: string;

  beforeEach(async () => {
    dbConnection = DatabaseConnection.getInstance();
    const pool = dbConnection.getPool();
    
    entryRepository = new PostgresEntryRepository(pool);
    genreTagRepository = new PostgresGenreTagRepository(pool);
    ratingRepository = new PostgresRatingRepository(pool);
    updateHandler = new UpdateEntryCommandHandler(entryRepository, genreTagRepository);
    createHandler = new CreateEntryCommandHandler(
      entryRepository,
      genreTagRepository,
      ratingRepository
    );

    // Clean up test data
    await pool.query('DELETE FROM ratings WHERE 1=1');
    await pool.query('DELETE FROM entry_tags WHERE 1=1');
    await pool.query('DELETE FROM entries WHERE 1=1');
    await pool.query('DELETE FROM users WHERE email = $1', ['test-integration@example.com']);
    await pool.query('DELETE FROM genre_tags WHERE name IN ($1, $2, $3, $4, $5)', ['Action', 'Drama', 'Thriller', 'Comedy', 'Horror']);

    // Create test user
    userId = crypto.randomUUID();
    await pool.query('INSERT INTO users (id, oauth_subject, email, name) VALUES ($1, $2, $3, $4)', [
      userId,
      'test-oauth',
      'test-integration@example.com',
      'Test User',
    ]);
  });

  afterAll(async () => {
    await dbConnection.getPool().end();
  });

  it('should update entry title in database', async () => {
    // Create entry first
    const tagId = crypto.randomUUID();
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Action']);

    const createCommand = new CreateEntryCommand(
      userId,
      'Original Title',
      'film',
      [tagId]
    );

    const createResult = await createHandler.handle(createCommand);
    const entryId = createResult.resourceId!;

    // Update entry
    const updateCommand = new UpdateEntryCommand({
      entryId,
      title: 'Updated Title',
    });

    await updateHandler.handle(updateCommand);

    // Verify update
    const result = await dbConnection.getPool().query('SELECT title FROM entries WHERE id = $1', [entryId]);

    expect(result.rows[0].title).toBe('Updated Title');
  });

  it('should update entry media type in database', async () => {
    const tagId = crypto.randomUUID();
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Drama']);

    const createCommand = new CreateEntryCommand(
      userId,
      'Test Movie',
      'film',
      [tagId]
    );

    const createResult = await createHandler.handle(createCommand);
    const entryId = createResult.resourceId!;

    const updateCommand = new UpdateEntryCommand({
      entryId,
      mediaType: 'series',
    });

    await updateHandler.handle(updateCommand);

    const result = await dbConnection.getPool().query('SELECT media_type FROM entries WHERE id = $1', [entryId]);

    expect(result.rows[0].media_type).toBe('series');
  });

  it('should update entry tags in database', async () => {
    const tagId1 = crypto.randomUUID();
    const tagId2 = crypto.randomUUID();
    const tagId3 = crypto.randomUUID();

    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId1, 'Action']);
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId2, 'Drama']);
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId3, 'Thriller']);

    const createCommand = new CreateEntryCommand(
      userId,
      'Test Movie',
      'film',
      [tagId1, tagId2]
    );

    const createResult = await createHandler.handle(createCommand);
    const entryId = createResult.resourceId!;

    const updateCommand = new UpdateEntryCommand({
      entryId,
      tagIds: [tagId2, tagId3],
    });

    await updateHandler.handle(updateCommand);

    const result = await dbConnection.getPool().query(
      'SELECT tag_id FROM entry_tags WHERE entry_id = $1 ORDER BY tag_id',
      [entryId]
    );

    const tagIds = result.rows.map((row: any) => row.tag_id);
    expect(tagIds).toEqual([tagId2, tagId3].sort());
  });

  it('should reject duplicate title', async () => {
    const tagId = crypto.randomUUID();
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Comedy']);

    const createCommand1 = new CreateEntryCommand(
      userId,
      'First Movie',
      'film',
      [tagId]
    );

    const createResult1 = await createHandler.handle(createCommand1);
    const entryId1 = createResult1.resourceId!;

    const createCommand2 = new CreateEntryCommand(
      userId,
      'Second Movie',
      'film',
      [tagId]
    );

    await createHandler.handle(createCommand2);

    const updateCommand = new UpdateEntryCommand({
      entryId: entryId1,
      title: 'Second Movie',
    });

    await expect(updateHandler.handle(updateCommand)).rejects.toThrow('Title already exists');
  });

  it('should update updatedAt timestamp', async () => {
    const tagId = crypto.randomUUID();
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Horror']);

    const createCommand = new CreateEntryCommand(
      userId,
      'Test Movie',
      'film',
      [tagId]
    );

    const createResult = await createHandler.handle(createCommand);
    const entryId = createResult.resourceId!;

    const beforeUpdate = await dbConnection.getPool().query('SELECT updated_at FROM entries WHERE id = $1', [entryId]);
    const beforeTime = beforeUpdate.rows[0].updated_at;

    // Wait a bit to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updateCommand = new UpdateEntryCommand({
      entryId,
      title: 'Updated Title',
    });

    await updateHandler.handle(updateCommand);

    const afterUpdate = await dbConnection.getPool().query('SELECT updated_at FROM entries WHERE id = $1', [entryId]);
    const afterTime = afterUpdate.rows[0].updated_at;

    expect(new Date(afterTime).getTime()).toBeGreaterThan(new Date(beforeTime).getTime());
  });
});
