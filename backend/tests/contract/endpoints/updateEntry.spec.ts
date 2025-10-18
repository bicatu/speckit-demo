import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createServer } from '../../../../src/ui/http/server';
import { DatabaseConnection } from '../../../../src/infrastructure/persistence/DatabaseConnection';

describe('PUT /api/v1/entries/:entryId', () => {
  let app: any;
  let db: DatabaseConnection;

  beforeEach(async () => {
    db = new DatabaseConnection();
    await db.connect();
    app = createServer();

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

  it('should return 200 when updating entry title', async () => {
    const tagId = crypto.randomUUID();
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Action']);

    const entryId = crypto.randomUUID();
    await db.query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, 'Original Title', 'film', null, null, null]
    );
    await db.query('INSERT INTO entry_genre_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId,
    ]);

    const response = await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        title: 'Updated Title',
      })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('updated');
  });

  it('should return 200 when updating entry media type', async () => {
    const tagId = crypto.randomUUID();
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Drama']);

    const entryId = crypto.randomUUID();
    await db.query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, 'Test Movie', 'film', null, null, null]
    );
    await db.query('INSERT INTO entry_genre_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId,
    ]);

    await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        mediaType: 'series',
      })
      .expect(200);
  });

  it('should return 200 when updating entry tags', async () => {
    const tagId1 = crypto.randomUUID();
    const tagId2 = crypto.randomUUID();
    const tagId3 = crypto.randomUUID();

    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId1, 'Action']);
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId2, 'Drama']);
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId3, 'Thriller']);

    const entryId = crypto.randomUUID();
    await db.query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, 'Test Movie', 'film', null, null, null]
    );
    await db.query('INSERT INTO entry_genre_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId1,
    ]);

    await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        tagIds: [tagId2, tagId3],
      })
      .expect(200);
  });

  it('should return 200 when updating multiple fields', async () => {
    const tagId1 = crypto.randomUUID();
    const tagId2 = crypto.randomUUID();
    const platformId = crypto.randomUUID();

    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId1, 'Comedy']);
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId2, 'Romance']);
    await db.query('INSERT INTO streaming_platforms (id, name) VALUES ($1, $2)', [
      platformId,
      'Netflix',
    ]);

    const entryId = crypto.randomUUID();
    await db.query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, 'Original Title', 'film', null, null, null]
    );
    await db.query('INSERT INTO entry_genre_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId1,
    ]);

    await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        title: 'New Title',
        mediaType: 'series',
        platformId,
        tagIds: [tagId2],
      })
      .expect(200);
  });

  it('should return 404 when entry not found', async () => {
    const nonExistentId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/v1/entries/${nonExistentId}`)
      .send({
        title: 'Updated Title',
      })
      .expect(404);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not found');
  });

  it('should return 409 when title already exists', async () => {
    const tagId = crypto.randomUUID();
    await db.query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, 'Sci-Fi']);

    const entryId1 = crypto.randomUUID();
    const entryId2 = crypto.randomUUID();

    await db.query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId1, 'First Movie', 'film', null, null, null]
    );
    await db.query('INSERT INTO entry_genre_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId1,
      tagId,
    ]);

    await db.query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId2, 'Second Movie', 'film', null, null, null]
    );
    await db.query('INSERT INTO entry_genre_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId2,
      tagId,
    ]);

    const response = await request(app.callback())
      .put(`/api/v1/entries/${entryId1}`)
      .send({
        title: 'Second Movie',
      })
      .expect(409);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('already exists');
  });

  it('should return 400 when title is empty', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        title: '',
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should return 400 when media type is invalid', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        mediaType: 'invalid',
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should return 400 when tagIds has too many items', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        tagIds: [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()],
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should return 400 when tagIds is empty array', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({
        tagIds: [],
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should return 400 when no fields provided', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/v1/entries/${entryId}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });
});
