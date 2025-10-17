import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from '@koa/router';
import DatabaseConnection from '../infrastructure/persistence/DatabaseConnection';
import { listEntries } from './actions/entries/listEntries';
import { getEntryById } from './actions/entries/getEntryById';
import { listTags } from './actions/tags/listTags';
import { listPlatforms } from './actions/platforms/listPlatforms';

/**
 * Creates and configures the Koa application server
 * @returns Configured Koa app instance
 */
export function createServer(): Koa {
  const app = new Koa();
  const router = new Router();

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
  router.get('/api/health', async (ctx: Koa.Context) => {
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

  // Entry routes
  router.get('/api/entries', listEntries);
  router.get('/api/entries/:id', getEntryById);

  // Tag and Platform routes (for filters)
  router.get('/api/tags', listTags);
  router.get('/api/platforms', listPlatforms);

  // Register routes
  app.use(router.routes()).use(router.allowedMethods());

  // Global error handler
  app.on('error', (err: Error, _ctx: Koa.Context) => {
    console.error('Server error:', err);
  });

  return app;
}
