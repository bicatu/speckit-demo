import { Container } from '../../../../src/config/Container';
import { HandlerRegistry } from '../../../../src/application/HandlerRegistry';
import { GetEntriesQuery } from '../../../../src/application/queries/entries/GetEntriesQuery';
import { GetEntriesQueryHandler } from '../../../../src/application/queries/entries/GetEntriesQueryHandler';
import { CreateEntryCommand } from '../../../../src/application/commands/entries/CreateEntryCommand';
import { CreateEntryCommandHandler } from '../../../../src/application/commands/entries/CreateEntryCommandHandler';
import DatabaseConnection from '../../../../src/infrastructure/persistence/DatabaseConnection';

describe('GetEntriesQuery Integration Tests', () => {
  let queryHandler: GetEntriesQueryHandler;
  let commandHandler: CreateEntryCommandHandler;
  let dbConnection: DatabaseConnection;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize container to register all handlers
    Container.getInstance();
    
    dbConnection = DatabaseConnection.getInstance();
    queryHandler = HandlerRegistry.getQueryHandler('GetEntriesQuery') as GetEntriesQueryHandler;
    commandHandler = HandlerRegistry.getCommandHandler('CreateEntryCommand') as CreateEntryCommandHandler;
  });

  beforeEach(async () => {
    const pool = dbConnection.getPool();
    
    // Clean up test data
    await pool.query('DELETE FROM ratings WHERE TRUE');
    await pool.query('DELETE FROM entry_tags WHERE TRUE');
    await pool.query('DELETE FROM entries WHERE TRUE');
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test-%']);
    await pool.query('DELETE FROM genre_tags WHERE name LIKE $1', ['Test%']);

    // Create a test user with a specific UUID
    const userResult = await pool.query(
      `INSERT INTO users (id, email, name, oauth_subject, last_login, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NULL, NOW())
       RETURNING id`,
      [`testuser-${Date.now()}@example.com`, 'Test User', `oauth-${Date.now()}`],
    );
    testUserId = userResult.rows[0].id;
  });

  afterEach(async () => {
    const pool = dbConnection.getPool();
    // Clean up test data
    await pool.query('DELETE FROM entry_tags WHERE entry_id IN (SELECT id FROM entries WHERE creator_id = $1)', [testUserId]);
    await pool.query('DELETE FROM entries WHERE creator_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('New To Me Filter', () => {
    it('should return only entries created after user last login', async () => {
      const pool = dbConnection.getPool();
      
      // Set user's last login to a specific time
      const lastLogin = new Date('2025-10-01T00:00:00Z');
      await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [lastLogin, testUserId]);

      // Create test tag
      const tagResult = await pool.query(
        'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
        ['Test Action']
      );
      const tagId = tagResult.rows[0].id;

      // Create entry BEFORE last login (should NOT be returned)
      const oldEntryCommand = new CreateEntryCommand(
        testUserId,
        'Old Movie',
        'film',
        [tagId],
        undefined,
        undefined
      );
      const oldResult = await commandHandler.handle(oldEntryCommand);
      expect(oldResult.success).toBe(true);

      // Manually update the old entry's created_at to be before last login
      // Disable trigger to prevent it from overwriting updated_at
      await pool.query('ALTER TABLE entries DISABLE TRIGGER update_entries_updated_at');
      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [new Date('2025-09-15T00:00:00Z'), oldResult.resourceId],
      );
      await pool.query('ALTER TABLE entries ENABLE TRIGGER update_entries_updated_at');

      // Create entry AFTER last login (should be returned)
      const newEntryCommand = new CreateEntryCommand(
        testUserId,
        'New Movie',
        'film',
        [tagId],
        undefined,
        undefined
      );
      const newResult = await commandHandler.handle(newEntryCommand);
      expect(newResult.success).toBe(true);

      // Manually update the new entry's created_at to be after last login
      // Disable trigger to prevent it from overwriting updated_at
      await pool.query('ALTER TABLE entries DISABLE TRIGGER update_entries_updated_at');
      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [new Date('2025-10-15T00:00:00Z'), newResult.resourceId],
      );
      await pool.query('ALTER TABLE entries ENABLE TRIGGER update_entries_updated_at');

      // Query with newToMe filter
      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          newToMe: true,
          userLastLogin: lastLogin,
        },
      };

      const result = await queryHandler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.entries).toHaveLength(1);
      expect(result.data!.entries[0].title).toBe('New Movie');
      expect(result.data!.total).toBe(1);
    });

    it('should return entries updated after user last login', async () => {
      const pool = dbConnection.getPool();
      
      // Set user's last login to a specific time
      const lastLogin = new Date('2025-10-01T00:00:00Z');
      await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [lastLogin, testUserId]);

      // Create test tag
      const tagResult = await pool.query(
        'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
        ['Test Drama']
      );
      const tagId = tagResult.rows[0].id;

      // Create entry before last login
      const entryCommand = new CreateEntryCommand(
        testUserId,
        'Updated Movie',
        'film',
        [tagId],
        undefined,
        undefined
      );
      const commandResult = await commandHandler.handle(entryCommand);
      expect(commandResult.success).toBe(true);

      // Set created_at before last login, but updated_at after
      // Disable trigger to prevent it from overwriting updated_at
      await pool.query('ALTER TABLE entries DISABLE TRIGGER update_entries_updated_at');
      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $2 WHERE id = $3`,
        [new Date('2025-09-15T00:00:00Z'), new Date('2025-10-15T00:00:00Z'), commandResult.resourceId],
      );
      await pool.query('ALTER TABLE entries ENABLE TRIGGER update_entries_updated_at');

      // Query with newToMe filter
      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          newToMe: true,
          userLastLogin: lastLogin,
        },
      };

      const result = await queryHandler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.entries).toHaveLength(1);
      expect(result.data!.entries[0].title).toBe('Updated Movie');
    });

    it('should return all entries when newToMe is false', async () => {
      const pool = dbConnection.getPool();
      
      const lastLogin = new Date('2025-10-01T00:00:00Z');
      await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [lastLogin, testUserId]);

      // Create test tag
      const tagResult = await pool.query(
        'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
        ['Test Sci-Fi']
      );
      const tagId = tagResult.rows[0].id;

      // Create multiple entries at different times
      const oldCommand = new CreateEntryCommand(
        testUserId,
        'Old Entry',
        'film',
        [tagId],
        undefined,
        undefined
      );
      const oldCommandResult = await commandHandler.handle(oldCommand);
      expect(oldCommandResult.success).toBe(true);

      const newCommand = new CreateEntryCommand(
        testUserId,
        'New Entry',
        'film',
        [tagId],
        undefined,
        undefined
      );
      const newCommandResult = await commandHandler.handle(newCommand);
      expect(newCommandResult.success).toBe(true);

      // Disable trigger to prevent it from overwriting updated_at
      await pool.query('ALTER TABLE entries DISABLE TRIGGER update_entries_updated_at');
      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [new Date('2025-09-15T00:00:00Z'), oldCommandResult.resourceId],
      );

      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [new Date('2025-10-15T00:00:00Z'), newCommandResult.resourceId],
      );
      await pool.query('ALTER TABLE entries ENABLE TRIGGER update_entries_updated_at');

      // Query without newToMe filter
      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          newToMe: false,
        },
      };

      const result = await queryHandler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Should return both entries
      expect(result.data!.entries.length).toBeGreaterThanOrEqual(2);
    });

    it('should combine newToMe filter with other filters', async () => {
      const pool = dbConnection.getPool();
      
      const lastLogin = new Date('2025-10-01T00:00:00Z');
      await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [lastLogin, testUserId]);

      // Create test tag
      const tagResult = await pool.query(
        'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
        ['Test Comedy']
      );
      const tagId = tagResult.rows[0].id;

      // Create a film after last login
      const filmCommand = new CreateEntryCommand(
        testUserId,
        'New Film',
        'film',
        [tagId],
        undefined,
        undefined
      );
      const filmResult = await commandHandler.handle(filmCommand);
      expect(filmResult.success).toBe(true);

      // Create a series after last login
      const seriesCommand = new CreateEntryCommand(
        testUserId,
        'New Series',
        'series',
        [tagId],
        undefined,
        undefined
      );
      const seriesResult = await commandHandler.handle(seriesCommand);
      expect(seriesResult.success).toBe(true);

      // Disable trigger to prevent it from overwriting updated_at
      await pool.query('ALTER TABLE entries DISABLE TRIGGER update_entries_updated_at');
      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [new Date('2025-10-15T00:00:00Z'), filmResult.resourceId],
      );

      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [new Date('2025-10-15T00:00:00Z'), seriesResult.resourceId],
      );
      await pool.query('ALTER TABLE entries ENABLE TRIGGER update_entries_updated_at');

      // Query for new films only
      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          mediaType: 'film',
          newToMe: true,
          userLastLogin: lastLogin,
        },
      };

      const result = await queryHandler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.entries).toHaveLength(1);
      expect(result.data!.entries[0].title).toBe('New Film');
      expect(result.data!.entries[0].mediaType).toBe('film');
    });

    it('should return empty array when no entries match newToMe criteria', async () => {
      const pool = dbConnection.getPool();
      
      const lastLogin = new Date('2025-10-15T00:00:00Z');
      await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [lastLogin, testUserId]);

      // Create test tag
      const tagResult = await pool.query(
        'INSERT INTO genre_tags (id, name) VALUES (gen_random_uuid(), $1) RETURNING id',
        ['Test Romance']
      );
      const tagId = tagResult.rows[0].id;

      // Create entry before last login
      const command = new CreateEntryCommand(
        testUserId,
        'Old Entry',
        'film',
        [tagId],
        undefined,
        undefined
      );
      const commandResult = await commandHandler.handle(command);
      expect(commandResult.success).toBe(true);

      // Disable trigger to prevent it from overwriting updated_at
      await pool.query('ALTER TABLE entries DISABLE TRIGGER update_entries_updated_at');
      await pool.query(
        `UPDATE entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [new Date('2025-09-15T00:00:00Z'), commandResult.resourceId],
      );
      await pool.query('ALTER TABLE entries ENABLE TRIGGER update_entries_updated_at');

      // Query with newToMe filter - should find no entries
      const query: GetEntriesQuery = {
        queryId: crypto.randomUUID(),
        timestamp: new Date(),
        filters: {
          newToMe: true,
          userLastLogin: lastLogin,
        },
      };

      const result = await queryHandler.handle(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.entries).toHaveLength(0);
      expect(result.data!.total).toBe(0);
    });
  });
});
