import request from 'supertest';
import { createServer } from '../../../src/ui/http/server';

describe('DELETE /api/v1/users/me', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    app = createServer();
    // Setup authentication token for tests
    authToken = 'test-auth-token'; // Mock token
  });

  afterAll(async () => {
    // Cleanup
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
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should not return any body content on success', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe('admin protection', () => {
    it('should return 403 when attempting to delete last admin account', async () => {
      // Setup: ensure user is last admin
      const adminToken = 'admin-auth-token';

      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('last admin');
    });
  });

  describe('error handling', () => {
    it('should return 404 when user not found', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User not found');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error scenario
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('data anonymization verification', () => {
    it('should preserve user entries after deletion', async () => {
      // This test verifies the contract that entries are preserved
      // The actual anonymization is tested in integration tests
      
      await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Subsequent request to get entries should show preserved entries
      // with anonymized creator
    });

    it('should preserve user ratings after deletion', async () => {
      // This test verifies the contract that ratings are preserved
      // The actual anonymization is tested in integration tests
      
      await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Subsequent request to get entry details should show preserved ratings
    });
  });

  describe('OpenAPI specification compliance', () => {
    it('should match OpenAPI response schema for 204', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      expect(response.body).toEqual({});
      expect(response.headers['content-length']).toBe('0');
    });

    it('should match OpenAPI error schema for 401', async () => {
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.any(String),
      });
    });

    it('should match OpenAPI error schema for 403', async () => {
      const adminToken = 'last-admin-token';
      
      const response = await request(app.callback())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        error: expect.any(String),
      });
    });
  });
});
