import { Pool } from 'pg';
import { IEntryRepository } from '../../domain/repositories/IEntryRepository';
import { Entry } from '../../domain/entities/Entry';

/**
 * PostgreSQL implementation of IEntryRepository
 * Handles all database operations for Entry aggregate
 */
export class PostgresEntryRepository implements IEntryRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<Entry | null> {
    const result = await this.pool.query(
      `SELECT id, title, media_type, creator_id, platform_id, average_rating, created_at, updated_at
       FROM entries WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByTitle(title: string): Promise<Entry | null> {
    const result = await this.pool.query(
      `SELECT id, title, media_type, creator_id, platform_id, average_rating, created_at, updated_at
       FROM entries WHERE title = $1`,
      [title],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findAll(
    filters?: {
      mediaType?: 'film' | 'series';
      platformId?: string;
      tagIds?: string[];
      newToMe?: boolean;
      userLastLogin?: Date;
    },
    limit: number = 20,
    offset: number = 0,
  ): Promise<Entry[]> {
    let query = `
      SELECT DISTINCT e.id, e.title, e.media_type, e.creator_id, e.platform_id, 
             e.average_rating, e.created_at, e.updated_at
      FROM entries e
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    let paramIndex = 1;

    // Join with entry_tags if filtering by tags
    if (filters?.tagIds && filters.tagIds.length > 0) {
      query += ` INNER JOIN entry_tags et ON e.id = et.entry_id`;
      conditions.push(`et.tag_id = ANY($${paramIndex}::uuid[])`);
      params.push(filters.tagIds);
      paramIndex++;
    }

    // Apply filters
    if (filters?.mediaType) {
      conditions.push(`e.media_type = $${paramIndex}`);
      params.push(filters.mediaType);
      paramIndex++;
    }

    if (filters?.platformId) {
      conditions.push(`e.platform_id = $${paramIndex}`);
      params.push(filters.platformId);
      paramIndex++;
    }

    // Apply "new to me" filter - entries created or updated after user's last login
    if (filters?.newToMe && filters.userLastLogin) {
      conditions.push(`(e.created_at > $${paramIndex}::timestamp OR e.updated_at > $${paramIndex}::timestamp)`);
      params.push(filters.userLastLogin.toISOString());
      paramIndex++;
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ordering by title
    query += ` ORDER BY e.title ASC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async save(entry: Entry): Promise<Entry> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if entry exists
      const existing = await client.query('SELECT id FROM entries WHERE id = $1', [entry.id]);

      if (existing.rows.length === 0) {
        // Insert new entry
        await client.query(
          `INSERT INTO entries (id, title, media_type, creator_id, platform_id, average_rating, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            entry.id,
            entry.title,
            entry.mediaType,
            entry.creatorId,
            entry.platformId,
            entry.averageRating,
            entry.createdAt,
            entry.updatedAt,
          ],
        );
      } else {
        // Update existing entry
        await client.query(
          `UPDATE entries 
           SET title = $2, media_type = $3, creator_id = $4, platform_id = $5, 
               average_rating = $6, updated_at = $7
           WHERE id = $1`,
          [
            entry.id,
            entry.title,
            entry.mediaType,
            entry.creatorId,
            entry.platformId,
            entry.averageRating,
            entry.updatedAt,
          ],
        );
      }

      await client.query('COMMIT');
      return entry;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM entries WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async count(filters?: {
    mediaType?: 'film' | 'series';
    platformId?: string;
    tagIds?: string[];
    newToMe?: boolean;
    userLastLogin?: Date;
  }): Promise<number> {
    let query = 'SELECT COUNT(DISTINCT e.id) as total FROM entries e';
    const params: any[] = [];
    const conditions: string[] = [];
    let paramIndex = 1;

    // Join with entry_tags if filtering by tags
    if (filters?.tagIds && filters.tagIds.length > 0) {
      query += ` INNER JOIN entry_tags et ON e.id = et.entry_id`;
      conditions.push(`et.tag_id = ANY($${paramIndex}::uuid[])`);
      params.push(filters.tagIds);
      paramIndex++;
    }

    // Apply filters
    if (filters?.mediaType) {
      conditions.push(`e.media_type = $${paramIndex}`);
      params.push(filters.mediaType);
      paramIndex++;
    }

    if (filters?.platformId) {
      conditions.push(`e.platform_id = $${paramIndex}`);
      params.push(filters.platformId);
      paramIndex++;
    }

    // Apply "new to me" filter - entries created or updated after user's last login
    if (filters?.newToMe && filters.userLastLogin) {
      conditions.push(`(e.created_at > $${paramIndex}::timestamp OR e.updated_at > $${paramIndex}::timestamp)`);
      params.push(filters.userLastLogin.toISOString());
      paramIndex++;
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].total, 10);
  }

  async findTopRated(limit: number): Promise<Entry[]> {
    const result = await this.pool.query(
      `SELECT id, title, media_type, creator_id, platform_id, average_rating, created_at, updated_at
       FROM entries
       WHERE average_rating IS NOT NULL
       ORDER BY average_rating DESC, title ASC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map((row) => this.mapToEntity(row));
  }

  async findRecent(limit: number): Promise<Entry[]> {
    const result = await this.pool.query(
      `SELECT id, title, media_type, creator_id, platform_id, average_rating, created_at, updated_at
       FROM entries
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map((row) => this.mapToEntity(row));
  }

  private mapToEntity(row: any): Entry {
    return new Entry({
      id: row.id,
      title: row.title,
      mediaType: row.media_type,
      creatorId: row.creator_id,
      platformId: row.platform_id,
      averageRating: row.average_rating ? parseFloat(row.average_rating) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
