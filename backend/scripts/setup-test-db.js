#!/usr/bin/env node
/**
 * Test database setup script
 * Initializes test database schema and seeds test users
 * 
 * Usage: npm run test:db:setup
 */
require('ts-node/register');
require('dotenv').config({ path: '.env.test' });

const { setupTestDatabase, getTestDatabaseConfig } = require('../tests/helpers/database');

async function main() {
  console.log('Setting up test database...');
  
  const config = getTestDatabaseConfig();
  console.log(`Database: ${config.database} at ${config.host}:${config.port}`);
  
  try {
    await setupTestDatabase();
    console.log('✓ Test database schema created');
    console.log('✓ Test users seeded');
    console.log('\nTest database is ready!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to setup test database:', error);
    process.exit(1);
  }
}

main();
