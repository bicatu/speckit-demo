/**
 * Database test utilities
 * Provides helper functions for setting up and managing test database
 */
import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Test database connection pool
 */
let testPool: Pool | null = null;

/**
 * Get test database configuration from environment
 */
export function getTestDatabaseConfig() {
  return {
    host: process.env.TEST_DATABASE_HOST || process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.TEST_DATABASE_PORT || process.env.DATABASE_PORT || '5432', 10),
    user: process.env.TEST_DATABASE_USER || process.env.DATABASE_USER || 'movietrack',
    password: process.env.TEST_DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || 'movietrack_dev_password',
    database: process.env.TEST_DATABASE_NAME || process.env.DATABASE_NAME || 'movietrack_db_test',
  };
}

/**
 * Create and return test database connection pool
 */
export function getTestDatabasePool(): Pool {
  if (!testPool) {
    const config = getTestDatabaseConfig();
    testPool = new Pool({
      ...config,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    testPool.on('error', (err) => {
      console.error('Test database pool error:', err);
    });
  }

  return testPool;
}

/**
 * Close test database connection pool
 */
export async function closeTestDatabase(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Execute SQL file against test database
 */
export async function executeSqlFile(filePath: string, client?: PoolClient): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const pool = client || getTestDatabasePool();
  await pool.query(sql);
}

/**
 * Run all database migrations to set up schema
 */
export async function runMigrations(client?: PoolClient): Promise<void> {
  const migrationsDir = path.join(__dirname, '../../src/infrastructure/persistence/migrations');
  const migrationFiles = [
    '001_initial_schema.sql',
    '003_make_platform_id_nullable.sql',
    '003_user_deletion_support.sql',
    '004_make_ratings_user_id_nullable.sql',
  ];

  const pool = client || getTestDatabasePool();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      await executeSqlFile(filePath, pool as PoolClient);
    }
  }
}

/**
 * Drop all tables in test database
 */
export async function dropAllTables(client?: PoolClient): Promise<void> {
  const pool = client || getTestDatabasePool();
  
  await pool.query(`
    DROP TABLE IF EXISTS ratings CASCADE;
    DROP TABLE IF EXISTS entry_tags CASCADE;
    DROP TABLE IF EXISTS entries CASCADE;
    DROP TABLE IF EXISTS genre_tags CASCADE;
    DROP TABLE IF EXISTS streaming_platforms CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
  `);
}

/**
 * Reset test database: drop all tables and re-run migrations
 */
export async function resetTestDatabase(): Promise<void> {
  const pool = getTestDatabasePool();
  const client = await pool.connect();

  try {
    await dropAllTables(client);
    await runMigrations(client);
  } finally {
    client.release();
  }
}

/**
 * Get test user configuration from environment
 */
export function getTestUserConfig() {
  return {
    regular: {
      id: process.env.TEST_REGULAR_USER_UUID || '550e8400-e29b-41d4-a716-446655440000',
      email: process.env.TEST_REGULAR_USER_EMAIL || 'testuser@example.com',
      name: process.env.TEST_REGULAR_USER_NAME || 'Test User',
      oauthSubject: process.env.TEST_REGULAR_USER_UUID || '550e8400-e29b-41d4-a716-446655440000',
      isAdmin: false,
    },
    admin: {
      id: process.env.TEST_ADMIN_USER_UUID || '550e8400-e29b-41d4-a716-446655440001',
      email: process.env.TEST_ADMIN_USER_EMAIL || 'admin@example.com',
      name: process.env.TEST_ADMIN_USER_NAME || 'Admin User',
      oauthSubject: process.env.TEST_ADMIN_USER_UUID || '550e8400-e29b-41d4-a716-446655440001',
      isAdmin: true,
    },
  };
}

/**
 * Seed test users into database
 */
export async function seedTestUsers(client?: PoolClient): Promise<void> {
  const pool = client || getTestDatabasePool();
  const users = getTestUserConfig();

  // Insert regular user
  await pool.query(
    `INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (oauth_subject) DO UPDATE 
     SET email = EXCLUDED.email, name = EXCLUDED.name, is_admin = EXCLUDED.is_admin`,
    [users.regular.id, users.regular.oauthSubject, users.regular.email, users.regular.name, users.regular.isAdmin]
  );

  // Insert admin user
  await pool.query(
    `INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (oauth_subject) DO UPDATE 
     SET email = EXCLUDED.email, name = EXCLUDED.name, is_admin = EXCLUDED.is_admin`,
    [users.admin.id, users.admin.oauthSubject, users.admin.email, users.admin.name, users.admin.isAdmin]
  );
}

/**
 * Delete all test users from database
 */
export async function deleteTestUsers(client?: PoolClient): Promise<void> {
  const pool = client || getTestDatabasePool();
  const users = getTestUserConfig();

  await pool.query('DELETE FROM users WHERE id = $1 OR id = $2', [users.regular.id, users.admin.id]);
}

/**
 * Clean all data from tables (keeps schema)
 */
export async function cleanAllTables(client?: PoolClient): Promise<void> {
  const pool = client || getTestDatabasePool();

  await pool.query('DELETE FROM ratings');
  await pool.query('DELETE FROM entry_tags');
  await pool.query('DELETE FROM entries');
  await pool.query('DELETE FROM genre_tags');
  await pool.query('DELETE FROM streaming_platforms');
  await pool.query('DELETE FROM users');
}

/**
 * Setup test database: reset schema and seed test users
 * Call this in beforeAll() for test suites that need database
 */
export async function setupTestDatabase(): Promise<void> {
  await resetTestDatabase();
  await seedTestUsers();
}

/**
 * Cleanup test database: remove all data
 * Call this in afterAll() for test suites
 */
export async function cleanupTestDatabase(): Promise<void> {
  await cleanAllTables();
  await closeTestDatabase();
}

/**
 * Create a test database transaction for isolated tests
 * Usage:
 *   const client = await beginTestTransaction();
 *   try {
 *     // ... test code ...
 *   } finally {
 *     await rollbackTestTransaction(client);
 *   }
 */
export async function beginTestTransaction(): Promise<PoolClient> {
  const pool = getTestDatabasePool();
  const client = await pool.connect();
  await client.query('BEGIN');
  return client;
}

/**
 * Rollback test transaction and release client
 */
export async function rollbackTestTransaction(client: PoolClient): Promise<void> {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

/**
 * Commit test transaction and release client
 */
export async function commitTestTransaction(client: PoolClient): Promise<void> {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}
