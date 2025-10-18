import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { UpdateEntryCommand } from '../../../../src/application/commands/entries/UpdateEntryCommand';
import { UpdateEntryCommandHandler } from '../../../../src/application/commands/entries/UpdateEntryCommandHandler';
import { CreateEntryCommand } from '../../../../src/application/commands/entries/CreateEntryCommand';
import { CreateEntryCommandHandler } from '../../../../src/application/commands/entries/CreateEntryCommandHandler';
import { PostgresEntryRepository } from '../../../../src/infrastructure/domain/PostgresEntryRepository';
import { PostgresGenreTagRepository } from '../../../../src/infrastructure/domain/PostgresGenreTagRepository';
import { PostgresRatingRepository } from '../../../../src/infrastructure/domain/PostgresRatingRepository';
import { DatabaseConnection } from '../../../../src/infrastructure/persistence/DatabaseConnection';

describe('UpdateEntryCommand Integration', () => {
  let db: DatabaseConnection;
  let entryRepository: PostgresEntryRepository;
  let genreTagRepository: PostgresGenreTagRepository;
  let ratingRepository: PostgresRatingRepository;
  let updateHandler: UpdateEntryCommandHandler;
  let createHandler: CreateEntryCommandHandler;

  beforeEach(async () => {
    db = new DatabaseConnection();
    await db.connect();
    entryRepository = new PostgresEntryRepository(db);
    genreTagRepository = new PostgresGenreTagRepository(db);
    ratingRepository = new PostgresRatingRepository(db);
    updateHandler = new UpdateEntryCommandHandler(entryRepository, genreTagRepository);
    createHandler = new CreateEntryCommandHandler(
      entryRepository,
      genreTagRepository,
      ratingRepository
    );

    // Clean up test data
    await db.query('DELETE FROM ratings WHERE 1=1');
    await db.query('DELETE FROM entry_genre_tags WHERE 1=1');
    await db.query('DELETE FROM entries WHERE 1=1');
  });

  afterAll(async () => {
    if (db) {
      await db.disconnect();
    }
  });

  it('should update entry title in database', async () => {
    // Create entry first
    const tagId = crypto.randomUUID();
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Action']);

    const createCommand = new CreateEntryCommand({
      title: 'Original Title',
      mediaType: 'film',
      tagIds: [tagId],
      creatorId: null,
      platformId: null,
      rating: null,
    });

    const entryId = await createHandler.execute(createCommand);

    // Update entry
    const updateCommand = new UpdateEntryCommand({
      entryId,
      title: 'Updated Title',
    });

    await updateHandler.execute(updateCommand);

    // Verify update
    const result = await db.query('SELECT title FROM entries WHERE id = $1', [entryId]);

    expect(result.rows[0].title).toBe('Updated Title');
  });

  it('should update entry media type in database', async () => {
    const tagId = crypto.randomUUID();
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Drama']);

    const createCommand = new CreateEntryCommand({
      title: 'Test Movie',
      mediaType: 'film',
      tagIds: [tagId],
      creatorId: null,
      platformId: null,
      rating: null,
    });

    const entryId = await createHandler.execute(createCommand);

    const updateCommand = new UpdateEntryCommand({
      entryId,
      mediaType: 'series',
    });

    await updateHandler.execute(updateCommand);

    const result = await db.query('SELECT media_type FROM entries WHERE id = $1', [entryId]);

    expect(result.rows[0].media_type).toBe('series');
  });

  it('should update entry tags in database', async () => {
    const tagId1 = crypto.randomUUID();
    const tagId2 = crypto.randomUUID();
    const tagId3 = crypto.randomUUID();

    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId1, 'Action']);
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId2, 'Drama']);
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId3, 'Thriller']);

    const createCommand = new CreateEntryCommand({
      title: 'Test Movie',
      mediaType: 'film',
      tagIds: [tagId1, tagId2],
      creatorId: null,
      platformId: null,
      rating: null,
    });

    const entryId = await createHandler.execute(createCommand);

    const updateCommand = new UpdateEntryCommand({
      entryId,
      tagIds: [tagId2, tagId3],
    });

    await updateHandler.execute(updateCommand);

    const result = await db.query(
      'SELECT tag_id FROM entry_genre_tags WHERE entry_id = $1 ORDER BY tag_id',
      [entryId]
    );

    const tagIds = result.rows.map((row) => row.tag_id);
    expect(tagIds).toEqual([tagId2, tagId3].sort());
  });

  it('should reject duplicate title', async () => {
    const tagId = crypto.randomUUID();
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Comedy']);

    const createCommand1 = new CreateEntryCommand({
      title: 'First Movie',
      mediaType: 'film',
      tagIds: [tagId],
      creatorId: null,
      platformId: null,
      rating: null,
    });

    const entryId1 = await createHandler.execute(createCommand1);

    const createCommand2 = new CreateEntryCommand({
      title: 'Second Movie',
      mediaType: 'film',
      tagIds: [tagId],
      creatorId: null,
      platformId: null,
      rating: null,
    });

    await createHandler.execute(createCommand2);

    const updateCommand = new UpdateEntryCommand({
      entryId: entryId1,
      title: 'Second Movie',
    });

    await expect(updateHandler.execute(updateCommand)).rejects.toThrow('Title already exists');
  });

  it('should update updatedAt timestamp', async () => {
    const tagId = crypto.randomUUID();
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Horror']);

    const createCommand = new CreateEntryCommand({
      title: 'Test Movie',
      mediaType: 'film',
      tagIds: [tagId],
      creatorId: null,
      platformId: null,
      rating: null,
    });

    const entryId = await createHandler.execute(createCommand);

    const beforeUpdate = await db.query('SELECT updated_at FROM entries WHERE id = $1', [entryId]);
    const beforeTime = beforeUpdate.rows[0].updated_at;

    // Wait a bit to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updateCommand = new UpdateEntryCommand({
      entryId,
      title: 'Updated Title',
    });

    await updateHandler.execute(updateCommand);

    const afterUpdate = await db.query('SELECT updated_at FROM entries WHERE id = $1', [entryId]);
    const afterTime = afterUpdate.rows[0].updated_at;

    expect(new Date(afterTime).getTime()).toBeGreaterThan(new Date(beforeTime).getTime());
  });
});
