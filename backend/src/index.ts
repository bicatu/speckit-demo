import 'dotenv/config';
import { createServer } from './ui/http/server';
import DatabaseConnection from './infrastructure/persistence/DatabaseConnection';
import { Container } from './config/Container';
import { validateAuthConfig } from './config/envSchema';
import { AuthProviderFactory } from './infrastructure/external/AuthProviderFactory';

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
    const container = Container.getInstance();
    console.log('✅ Dependency injection container initialized');

    // Validate authentication configuration at startup (fail fast if misconfigured)
    const authProvider = process.env.AUTH_PROVIDER || 'mock';
    if (!process.env.AUTH_PROVIDER) {
      console.warn('⚠️  AUTH_PROVIDER not set, defaulting to "mock" (not suitable for production)');
    }

    // Validate environment-specific configuration using Zod schemas
    try {
      validateAuthConfig(authProvider);
    } catch (error) {
      console.error('❌ Authentication configuration validation failed');
      throw error;
    }

    // Trigger provider creation to ensure factory can instantiate the provider
    try {
      AuthProviderFactory.getInstance();
      console.log(`✅ Authentication provider initialized: ${authProvider}`);
    } catch (error) {
      console.error('❌ Authentication provider initialization failed');
      throw error;
    }

    // Start periodic cleanup for TokenCache and OAuthStateManager (every 60 seconds)
    const tokenCache = container.getTokenCache();
    const oauthStateManager = container.getOAuthStateManager();
    
    const cleanupInterval = setInterval(() => {
      tokenCache.cleanup();
      oauthStateManager.cleanup();
    }, 60000); // 60 seconds

    // Start cache hit rate monitoring (every 5 minutes)
    const monitoringInterval = setInterval(() => {
      const stats = tokenCache.getStats();
      const utilization = ((stats.size / stats.maxSize) * 100).toFixed(1);
      console.log(`[TokenCache] Size: ${stats.size}/${stats.maxSize} (${utilization}%), Hit rate: ${stats.hitRate.toFixed(2)}`);
    }, 300000); // 5 minutes

    // Create and start server
    const app = createServer();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server...');
      clearInterval(cleanupInterval);
      clearInterval(monitoringInterval);
      await db.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing server...');
      clearInterval(cleanupInterval);
      clearInterval(monitoringInterval);
      await db.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to bootstrap application:', error);
    process.exit(1);
  }
}

bootstrap();
