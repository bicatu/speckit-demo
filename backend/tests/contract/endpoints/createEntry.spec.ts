import request from 'supertest';
import { Container } from '../../../src/config/Container';
import { createServer } from '../../../src/ui/http/server';
import DatabaseConnection from '../../../src/infrastructure/persistence/DatabaseConnection';
import type Koa from 'koa';

describe('POST /api/entries - Contract Tests', () => {
  let app: Koa;
  let dbConnection: DatabaseConnection;
  let testUserId: string;
  let authToken: string;
  let tagId1: string;
  let tagId2: string;

  beforeAll(async () => {
    // Initialize container and create server
    Container.getInstance();
    app = createServer();
    
    dbConnection = DatabaseConnection.getInstance();
  });

  afterAll(async () => {
    // Don't close shared database connection in tests
  });

  beforeEach(async () => {
    const pool = dbConnection.getPool();

    // Clean up test data
    await pool.query('DELETE FROM ratings WHERE TRUE');
    await pool.query('DELETE FROM entry_tags WHERE TRUE');
    await pool.query('DELETE FROM entries WHERE title LIKE $1', ['Contract%']);
    await pool.query('DELETE FROM users WHERE email = $1', ['contract-test@example.com']);
    await pool.query('DELETE FROM genre_tags WHERE name LIKE $1', ['Contract%']);

    // Create test user
    const userResult = await pool.query(
      'INSERT INTO users (id, oauth_subject, email, name) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id',
      ['contract-oauth-subject', 'contract-test@example.com', 'Contract Test User']
    );
    testUserId = userResult.rows[0].id;

    // Mock auth token (for testing, we'll use the user ID)
    authToken = testUserId;

    // Create test tags
    const tag1Result = await pool.query(
      'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
      ['Contract Action']
    );
    const tag2Result = await pool.query(
      'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
      ['Contract Sci-Fi']
    );
    tagId1 = tag1Result.rows[0].id;
    tagId2 = tag2Result.rows[0].id;
  });

  describe('POST /api/entries', () => {
    it('should return 201 and create entry with valid data', async () => {
      const response = await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Contract Test Movie',
          mediaType: 'film',
          tagIds: [tagId1, tagId2],
        })
        .expect(201);

      expect(response.body).toHaveProperty('entryId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Entry created successfully');
    });

    it('should return 201 and create entry with optional platform and rating', async () => {
      const pool = dbConnection.getPool();
      const platformResult = await pool.query(
        'SELECT id FROM streaming_platforms LIMIT 1'
      );
      const platformId = platformResult.rows[0]?.id;

      const response = await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Contract Test Series',
          mediaType: 'series',
          tagIds: [tagId1],
          platformId,
          initialRating: 8,
        })
        .expect(201);

      expect(response.body).toHaveProperty('entryId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Entry created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Entry',
          // Missing mediaType and tagIds
        })
        .expect(400);
    });

    it('should return 400 for invalid mediaType', async () => {
      await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid MediaType Entry',
          mediaType: 'invalid',
          tagIds: [tagId1],
        })
        .expect(400);
    });

    it('should return 400 for too few tags (< 1)', async () => {
      await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Tags Entry',
          mediaType: 'film',
          tagIds: [],
        })
        .expect(400);
    });

    it('should return 400 for too many tags (> 3)', async () => {
      const pool = dbConnection.getPool();
      const tag3Result = await pool.query(
        'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
        ['Contract Tag 3']
      );
      const tag4Result = await pool.query(
        'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
        ['Contract Tag 4']
      );

      await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Too Many Tags Entry',
          mediaType: 'film',
          tagIds: [tagId1, tagId2, tag3Result.rows[0].id, tag4Result.rows[0].id],
        })
        .expect(400);
    });

    it('should return 400 for invalid rating (< 1)', async () => {
      await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Low Rating Entry',
          mediaType: 'film',
          tagIds: [tagId1],
          initialRating: 0,
        })
        .expect(400);
    });

    it('should return 400 for invalid rating (> 10)', async () => {
      await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'High Rating Entry',
          mediaType: 'film',
          tagIds: [tagId1],
          initialRating: 11,
        })
        .expect(400);
    });

    it('should return 409 for duplicate title', async () => {
      const pool = dbConnection.getPool();
      await pool.query(
        'INSERT INTO entries (id, title, media_type, creator_id, platform_id) VALUES (gen_random_uuid(), $1, $2, $3, NULL)',
        ['Contract Duplicate', 'film', testUserId]
      );

      await request(app.callback())
        .post('/api/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Contract Duplicate',
          mediaType: 'film',
          tagIds: [tagId1],
        })
        .expect(409);
    });

    it('should return 401 without authentication', async () => {
      await request(app.callback())
        .post('/api/entries')
        .send({
          title: 'Unauthorized Entry',
          mediaType: 'film',
          tagIds: [tagId1],
        })
        .expect(401);
    });
  });
});
