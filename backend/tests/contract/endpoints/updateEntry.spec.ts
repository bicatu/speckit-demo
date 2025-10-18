import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createServer } from '../../../src/ui/http/server';
import DatabaseConnection from '../../../src/infrastructure/persistence/DatabaseConnection';
import { Container } from '../../../src/config/Container';

describe('PUT /api/entries/:entryId', () => {
  let app: any;
  let dbConnection: DatabaseConnection;
  let testUserId: string;
  let authToken: string;
  let testEmail: string;
  let testSuffix: string;

  beforeEach(async () => {
    // Initialize container to register handlers
    Container.getInstance();
    
    dbConnection = DatabaseConnection.getInstance();
    app = createServer();

    // Generate unique suffix for this test run
    testSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    testEmail = `test-update-${testSuffix}@example.com`;
    testUserId = crypto.randomUUID();

    // Create test user
    const pool = dbConnection.getPool();
    await pool.query('INSERT INTO users (id, oauth_subject, email, name) VALUES ($1, $2, $3, $4)', [
      testUserId,
      `test-oauth-${testUserId}`,
      testEmail,
      'Test User',
    ]);

    // Mock auth token (for testing, we'll use the user ID)
    authToken = testUserId;
  });

  afterAll(async () => {
    await dbConnection.getPool().end();
  });

  it('should return 200 when updating entry title', async () => {
    const tagId = crypto.randomUUID();
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, `Action-${testSuffix}`]);

    const entryId = crypto.randomUUID();
    await dbConnection.getPool().query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, `Original Title ${testSuffix}`, 'film', testUserId, null, null]
    );
    await dbConnection.getPool().query('INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId,
    ]);

    const response = await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: `Updated Title ${testSuffix}`,
      })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('updated');
  });

  it('should return 200 when updating entry media type', async () => {
    const tagId = crypto.randomUUID();
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, `Drama-${testSuffix}`]);

    const entryId = crypto.randomUUID();
    await dbConnection.getPool().query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, `Test Movie ${testSuffix}`, 'film', testUserId, null, null]
    );
    await dbConnection.getPool().query('INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId,
    ]);

    await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mediaType: 'series',
      })
      .expect(200);
  });

  it('should return 200 when updating entry tags', async () => {
    const tagId1 = crypto.randomUUID();
    const tagId2 = crypto.randomUUID();
    const tagId3 = crypto.randomUUID();

    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId1, `Action2-${testSuffix}`]);
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId2, `Drama2-${testSuffix}`]);
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId3, `Thriller-${testSuffix}`]);

    const entryId = crypto.randomUUID();
    await dbConnection.getPool().query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, `Test Movie 2 ${testSuffix}`, 'film', testUserId, null, null]
    );
    await dbConnection.getPool().query('INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId1,
    ]);

    await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tagIds: [tagId2, tagId3],
      })
      .expect(200);
  });

  it('should return 200 when updating multiple fields', async () => {
    const tagId1 = crypto.randomUUID();
    const tagId2 = crypto.randomUUID();
    const platformId = crypto.randomUUID();

    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId1, `Comedy-${testSuffix}`]);
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId2, `Romance-${testSuffix}`]);
    await dbConnection.getPool().query('INSERT INTO streaming_platforms (id, name) VALUES ($1, $2)', [
      platformId,
      `Netflix-${testSuffix}`,
    ]);

    const entryId = crypto.randomUUID();
    await dbConnection.getPool().query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, `Original Title 2 ${testSuffix}`, 'film', testUserId, null, null]
    );
    await dbConnection.getPool().query('INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId,
      tagId1,
    ]);

    await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: `New Title ${testSuffix}`,
        mediaType: 'series',
        platformId,
        tagIds: [tagId2],
      })
      .expect(200);
  });

  it('should return 404 when entry not found', async () => {
    const nonExistentId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/entries/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Title',
      })
      .expect(404);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not found');
  });

  it('should return 409 when title already exists', async () => {
    const tagId = crypto.randomUUID();
    await dbConnection.getPool().query('INSERT INTO genre_tags (id, name) VALUES ($1, $2)', [tagId, `Sci-Fi-${testSuffix}`]);

    const entryId1 = crypto.randomUUID();
    const entryId2 = crypto.randomUUID();

    await dbConnection.getPool().query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId1, `First Movie ${testSuffix}`, 'film', testUserId, null, null]
    );
    await dbConnection.getPool().query('INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId1,
      tagId,
    ]);

    await dbConnection.getPool().query(
      'INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId2, `Second Movie ${testSuffix}`, 'film', testUserId, null, null]
    );
    await dbConnection.getPool().query('INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)', [
      entryId2,
      tagId,
    ]);

    const response = await request(app.callback())
      .put(`/api/entries/${entryId1}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: `Second Movie ${testSuffix}`,
      })
      .expect(409);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('already exists');
  });

  it('should return 400 when title is empty', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '',
      })
      .expect(400);

    expect(response.body).toHaveProperty('details');
  });

  it('should return 400 when media type is invalid', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mediaType: 'invalid',
      })
      .expect(400);

    expect(response.body).toHaveProperty('details');
  });

  it('should return 400 when tagIds has too many items', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tagIds: [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()],
      })
      .expect(400);

    expect(response.body).toHaveProperty('details');
  });

  it('should return 400 when tagIds is empty array', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tagIds: [],
      })
      .expect(400);

    expect(response.body).toHaveProperty('details');
  });

  it('should return 400 when no fields provided', async () => {
    const entryId = crypto.randomUUID();

    const response = await request(app.callback())
      .put(`/api/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('details');
  });
});
