import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { Container } from '../../../src/config/Container';
import { createServer } from '../../../src/ui/http/server';
import DatabaseConnection from '../../../src/infrastructure/persistence/DatabaseConnection';

describe('POST /api/tags - Admin', () => {
  let app: any;
  let dbConnection: DatabaseConnection;
  let adminToken: string;

  beforeAll(async () => {
    // Initialize container and create server
    Container.getInstance();
    app = createServer();
    
    dbConnection = DatabaseConnection.getInstance();
  });

  afterAll(async () => {
    await dbConnection.getPool().end();
  });

  beforeEach(async () => {
    const pool = dbConnection.getPool();

    // Clean up test data
    await pool.query('DELETE FROM genre_tags WHERE name LIKE $1', ['Test%']);

    // TODO: Create admin token for testing
    // For now, we'll use mock admin token
    adminToken = 'mock-admin-token';
  });

  it('should return 201 when creating tag as admin', async () => {
    const response = await request(app.callback())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Genre',
      })
      .expect(201);

    expect(response.body).toHaveProperty('tagId');
    expect(response.body).toHaveProperty('message', 'Genre tag created successfully');
  });

  it('should return 400 when name is missing', async () => {
    const response = await request(app.callback())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when name is empty', async () => {
    const response = await request(app.callback())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 when tag name already exists', async () => {
    const testSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const tagName = `Dup-${testSuffix}`;
    
    await request(app.callback())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: tagName,
      })
      .expect(201);

    const response = await request(app.callback())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: tagName,
      })
      .expect(409);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('already exists');
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.callback())
      .post('/api/tags')
      .send({
        name: 'Test Genre',
      })
      .expect(401);
  });

  it('should return 403 when authenticated but not admin', async () => {
    const userToken = 'mock-user-token';

    await request(app.callback())
      .post('/api/tags')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Genre',
      })
      .expect(403);
  });
});
