import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from '@koa/router';
import { DatabaseConnection } from '../infrastructure/persistence/DatabaseConnection';

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
      onerror: (err, ctx) => {
        ctx.status = 400;
        ctx.body = { error: 'Invalid JSON payload' };
      },
    }),
  );

  // Health check endpoint
  router.get('/api/health', async (ctx) => {
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

  // Mount router
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Global error handler
  app.on('error', (err, ctx) => {
    console.error('Server error:', err);
  });

  return app;
}

/**
 * Starts the HTTP server on specified port
 * @param port Port number to listen on
 */
export async function startServer(port: number = 3000): Promise<void> {
  const app = createServer();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    const db = DatabaseConnection.getInstance();
    await db.close();
    process.exit(0);
  });

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
