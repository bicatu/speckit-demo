import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'movietrack_db',
  user: process.env.DB_USER || 'movietrack',
  password: process.env.DB_PASSWORD || 'movietrack_dev_password',
});

async function runMigrations() {
  console.log("🚀 Running database migrations...\n");

  const client = await pool.connect();

  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read all migration files from src directory
    // When compiled, __dirname points to dist/, so we need to go back to src/
    const migrationsDir = path.join(__dirname, "../../../src/infrastructure/persistence/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${files.length} migration files\n`);

    for (const file of files) {
      // Check if migration was already applied
      const result = await client.query(
        'SELECT name FROM migrations WHERE name = $1',
        [file],
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }

      // Read and execute migration
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`📝 Applying ${file}...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied ${file}\n`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error applying ${file}:`, err);
        throw err;
      }
    }

    console.log('✨ All migrations completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
