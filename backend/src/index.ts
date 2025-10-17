import 'dotenv/config';
import { createServer } from './ui/http/server';
import DatabaseConnection from './infrastructure/persistence/DatabaseConnection';
import { Container } from './config/Container';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/**
 * Bootstrap and start the application
 */
async function bootstrap(): Promise<void> {
  try {
    // Test database connection
    const db = DatabaseConnection.getInstance();
    await db.query('SELECT 1');
    console.log('✅ Database connection established');

    // Initialize dependency injection container
    Container.getInstance();
    console.log('✅ Dependency injection container initialized');

    // Create and start server
    const app = createServer();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server...');
      await db.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing server...');
      await db.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to bootstrap application:', error);
    process.exit(1);
  }
}

bootstrap();
