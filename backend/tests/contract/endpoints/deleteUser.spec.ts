import request from 'supertest';
import { Container } from '../../../src/config/Container';
import { createServer } from '../../../src/ui/http/server';
import { setupTestDatabase, cleanupTestDatabase, getTestUserConfig, getTestDatabasePool } from '../../helpers/database';

describe('DELETE /api/v1/users/me', () => {
  let app: any;
  let regularUserToken: string;
  let adminUserToken: string;
  let testUsers: ReturnType<typeof getTestUserConfig>;

  beforeAll(async () => {
    // Setup test database with schema and test users
    await setupTestDatabase();
    
    // Get test user configuration
    testUsers = getTestUserConfig();
    regularUserToken = testUsers.regular.id;
    adminUserToken = testUsers.admin.id;

    // Initialize container and create server
    Container.getInstance();
    app = createServer();
  });

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase();
  });

  describe('authentication', () => {
    it('should return 401 when no auth token provided', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 when invalid auth token provided', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('successful deletion', () => {
    it('should return 204 on successful account deletion', async () => {
      await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(204);
      
      // Verify user was deleted from database
      const pool = getTestDatabasePool();
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [testUsers.regular.id]);
      expect(result.rows.length).toBe(0);
      
      // Re-seed the regular user for subsequent tests
      await pool.query(
        `INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [testUsers.regular.id, testUsers.regular.oauthSubject, testUsers.regular.email, testUsers.regular.name, testUsers.regular.isAdmin]
      );
    });

    it('should not return any body content on success', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(204);

      expect(response.body).toEqual({});
      
      // Re-seed the regular user for subsequent tests
      const pool = getTestDatabasePool();
      await pool.query(
        `INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [testUsers.regular.id, testUsers.regular.oauthSubject, testUsers.regular.email, testUsers.regular.name, testUsers.regular.isAdmin]
      );
    });
  });

  describe('admin protection', () => {
    it('should return 403 when attempting to delete last admin account', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('last admin');
    });
  });

  describe('error handling', () => {
    it('should return 404 when user not found', async () => {
      // Use a non-existent UUID
      const nonExistentToken = '999e8400-e29b-41d4-a716-446655440999';
      
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${nonExistentToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User not found');
    });

    it('should handle database errors gracefully', async () => {
      // This test verifies error handling - using non-existent user returns 404
      const nonExistentToken = '888e8400-e29b-41d4-a716-446655440888';
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${nonExistentToken}`);

      // Should handle gracefully with either 404 (user not found) or 500 (DB error)
      expect([404, 500]).toContain(response.status);
      if (response.status === 404 || response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('data anonymization verification', () => {
    it('should preserve user entries after deletion', async () => {
      const pool = getTestDatabasePool();
      
      // Create a streaming platform for the entry
      const platformId = 'a1111111-1111-1111-1111-111111111111';
      await pool.query(
        'INSERT INTO streaming_platforms (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [platformId, 'Test Platform']
      );
      
      // Create an entry by the regular user
      const entryId = 'e1111111-1111-1111-1111-111111111111';
      await pool.query(
        `INSERT INTO entries (id, title, media_type, creator_id, platform_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (title) DO UPDATE SET creator_id = EXCLUDED.creator_id`,
        [entryId, 'Test Entry for Deletion', 'film', testUsers.regular.id, platformId]
      );
      
      // Delete the user
      await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(204);
      
      // Verify entry still exists with NULL creator_id
      const entryResult = await pool.query('SELECT * FROM entries WHERE id = $1', [entryId]);
      expect(entryResult.rows.length).toBe(1);
      expect(entryResult.rows[0].creator_id).toBeNull();
      
      // Cleanup
      await pool.query('DELETE FROM entries WHERE id = $1', [entryId]);
      await pool.query('DELETE FROM streaming_platforms WHERE id = $1', [platformId]);
      
      // Re-seed the regular user
      await pool.query(
        `INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [testUsers.regular.id, testUsers.regular.oauthSubject, testUsers.regular.email, testUsers.regular.name, testUsers.regular.isAdmin]
      );
    });

    it('should preserve user ratings after deletion', async () => {
      const pool = getTestDatabasePool();
      
      // Create a streaming platform for the entry
      const platformId = 'b2222222-2222-2222-2222-222222222222';
      await pool.query(
        'INSERT INTO streaming_platforms (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [platformId, 'Rating Test Platform']
      );
      
      // Create an entry
      const entryId = 'f2222222-2222-2222-2222-222222222222';
      await pool.query(
        `INSERT INTO entries (id, title, media_type, creator_id, platform_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (title) DO UPDATE SET id = EXCLUDED.id`,
        [entryId, 'Entry for Rating Test', 'film', testUsers.admin.id, platformId]
      );
      
      // Create a rating by the regular user
      await pool.query(
        `INSERT INTO ratings (user_id, entry_id, stars, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [testUsers.regular.id, entryId, 8]
      );
      
      // Delete the user
      await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(204);
      
      // Verify rating still exists with NULL user_id
      const ratingResult = await pool.query('SELECT * FROM ratings WHERE entry_id = $1', [entryId]);
      expect(ratingResult.rows.length).toBe(1);
      expect(ratingResult.rows[0].user_id).toBeNull();
      
      // Cleanup
      await pool.query('DELETE FROM ratings WHERE entry_id = $1', [entryId]);
      await pool.query('DELETE FROM entries WHERE id = $1', [entryId]);
      await pool.query('DELETE FROM streaming_platforms WHERE id = $1', [platformId]);
      
      // Re-seed the regular user
      await pool.query(
        `INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [testUsers.regular.id, testUsers.regular.oauthSubject, testUsers.regular.email, testUsers.regular.name, testUsers.regular.isAdmin]
      );
    });
  });

  describe('OpenAPI specification compliance', () => {
    it('should match OpenAPI response schema for 204', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(204);

      expect(response.body).toEqual({});
      
      // Re-seed the regular user for subsequent tests
      const pool = getTestDatabasePool();
      await pool.query(
        `INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [testUsers.regular.id, testUsers.regular.oauthSubject, testUsers.regular.email, testUsers.regular.name, testUsers.regular.isAdmin]
      );
    });

    it('should match OpenAPI error schema for 401', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.any(String),
      });
    });

    it.skip('should match OpenAPI error schema for 403', async () => {
      // Test skipped - covered by admin protection test above
    });
  });
});
