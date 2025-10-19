/**
 * Jest setup file
 * Configures test environment before running tests
 */
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);
