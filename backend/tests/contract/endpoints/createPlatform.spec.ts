import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { Container } from '../../../src/config/Container';
import { createServer } from '../../../src/ui/http/server';
import DatabaseConnection from '../../../src/infrastructure/persistence/DatabaseConnection';

describe('POST /api/platforms - Admin', () => {
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
    // Don't close shared database connection in tests
  });

  beforeEach(async () => {
    const pool = dbConnection.getPool();

    // Clean up test data
    await pool.query('DELETE FROM streaming_platforms WHERE name LIKE $1', ['Test%']);

    // TODO: Create admin token for testing
    // For now, we'll use mock admin token
    adminToken = 'mock-admin-token';
  });

  it('should return 201 when creating platform as admin', async () => {
    const response = await request(app.callback())
      .post('/api/platforms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Platform',
      })
      .expect(201);

    expect(response.body).toHaveProperty('platformId');
    expect(response.body).toHaveProperty('message', 'Streaming platform created successfully');
  });

  it('should return 400 when name is missing', async () => {
    const response = await request(app.callback())
      .post('/api/platforms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when name is empty', async () => {
    const response = await request(app.callback())
      .post('/api/platforms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 when platform name already exists', async () => {
    await request(app.callback())
      .post('/api/platforms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Platform',
      })
      .expect(201);

    const response = await request(app.callback())
      .post('/api/platforms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Platform',
      })
      .expect(409);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('already exists');
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.callback())
      .post('/api/platforms')
      .send({
        name: 'Test Platform',
      })
      .expect(401);
  });

  it('should return 403 when authenticated but not admin', async () => {
    const userToken = 'mock-user-token';

    await request(app.callback())
      .post('/api/platforms')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Platform',
      })
      .expect(403);
  });
});
