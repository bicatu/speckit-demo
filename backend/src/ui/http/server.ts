import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import Router from '@koa/router';
import { koaSwagger } from 'koa2-swagger-ui';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import DatabaseConnection from '../../infrastructure/persistence/DatabaseConnection';
import { authMiddleware, adminMiddleware } from './middleware/auth';
import { listEntries } from './actions/entries/listEntries';
import { getEntryById } from './actions/entries/getEntryById';
import { createEntry } from './actions/entries/createEntry';
import { updateEntry } from './actions/entries/updateEntry';
import { listTags } from './actions/tags/listTags';
import { listPlatforms } from './actions/platforms/listPlatforms';
import { addRating } from './actions/ratings/addRating';
import { createPlatform } from './actions/platforms/createPlatform';
import { deletePlatform } from './actions/platforms/deletePlatform';
import { createTag } from './actions/tags/createTag';
import { deleteTag } from './actions/tags/deleteTag';
import { deleteUser } from './actions/users/deleteUser';

/**
 * Creates and configures the Koa application server
 * @returns Configured Koa app instance
 */
export function createServer(): Koa {
  const app = new Koa();
  const router = new Router();

  // Middleware: CORS
  app.use(
    cors({
      origin: (ctx: Koa.Context) => {
        const origin = ctx.request.headers.origin;
        // Allow localhost on any port for development
        if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
          return origin;
        }
        // Fallback for production or when FRONTEND_URL is set
        return process.env.FRONTEND_URL || 'http://localhost:5173';
      },
      credentials: true,
    }),
  );

  // Middleware: Body parser for JSON requests
  app.use(
    bodyParser({
      enableTypes: ['json'],
      jsonLimit: '10mb',
      strict: true,
      onerror: (_err: Error, ctx: Koa.Context) => {
        ctx.status = 400;
        ctx.body = { error: 'Invalid JSON payload' };
      },
    }),
  );

  // Health check endpoint
  router.get('/health', async (ctx: Koa.Context) => {
    try {
      const db = DatabaseConnection.getInstance();
      await db.query('SELECT 1');
      ctx.status = 200;
      ctx.body = { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      ctx.status = 503;
      ctx.body = { status: 'unhealthy', error: 'Database connection failed' };
    }
  });

  // Serve OpenAPI specification (YAML converted to JSON for Swagger UI)
  router.get('/api/openapi.json', async (ctx: Koa.Context) => {
    // Path to the existing openapi.yaml in specs directory
    const openapiPath = path.join(__dirname, '../../../../../specs/001-multi-user-movie/contracts/openapi.yaml');
    const openapiYaml = fs.readFileSync(openapiPath, 'utf-8');
    const openapiSpec = yaml.load(openapiYaml);
    ctx.body = openapiSpec;
  });

  // Swagger UI
  app.use(
    koaSwagger({
      routePrefix: '/api/docs',
      swaggerOptions: {
        url: '/api/openapi.json',
      },
    }),
  );

  // Entry routes
  router.get('/api/entries', listEntries);
  router.get('/api/entries/:id', getEntryById);
  router.post('/api/entries', authMiddleware, createEntry);
  router.put('/api/entries/:entryId', authMiddleware, updateEntry);

  // Rating routes
  router.post('/api/entries/:entryId/ratings', authMiddleware, addRating);

  // Tag and Platform routes (for filters)
  router.get('/api/tags', listTags);
  router.get('/api/platforms', listPlatforms);

  // Admin routes for platform management
  router.post('/api/platforms', authMiddleware, adminMiddleware, createPlatform);
  router.delete('/api/platforms/:platformId', authMiddleware, adminMiddleware, deletePlatform);

  // Admin routes for tag management
  router.post('/api/tags', authMiddleware, adminMiddleware, createTag);
  router.delete('/api/tags/:tagId', authMiddleware, adminMiddleware, deleteTag);

  // User account routes
  router.delete('/api/v1/users/me', authMiddleware, deleteUser);

  // Register routes
  app.use(router.routes()).use(router.allowedMethods());

  // Global error handler
  app.on('error', (err: Error, _ctx: Koa.Context) => {
    console.error('Server error:', err);
  });

  return app;
}
