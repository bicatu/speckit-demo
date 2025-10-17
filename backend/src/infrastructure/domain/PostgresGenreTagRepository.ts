import { Pool } from 'pg';
import { IGenreTagRepository } from '../../domain/repositories/IGenreTagRepository';
import { GenreTag } from '../../domain/entities/GenreTag';

/**
 * PostgreSQL implementation of IGenreTagRepository
 * Handles database operations for GenreTag entity and entry_tags junction table
 */
export class PostgresGenreTagRepository implements IGenreTagRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<GenreTag | null> {
    const result = await this.pool.query(
      'SELECT id, name FROM genre_tags WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByName(name: string): Promise<GenreTag | null> {
    const result = await this.pool.query(
      'SELECT id, name FROM genre_tags WHERE name = $1',
      [name],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findAll(): Promise<GenreTag[]> {
    const result = await this.pool.query(
      'SELECT id, name FROM genre_tags ORDER BY name ASC',
    );

    return result.rows.map((row) => this.mapToEntity(row));
  }

  async findByEntryId(entryId: string): Promise<GenreTag[]> {
    const result = await this.pool.query(
      `SELECT gt.id, gt.name 
       FROM genre_tags gt
       INNER JOIN entry_tags et ON gt.id = et.tag_id
       WHERE et.entry_id = $1
       ORDER BY gt.name ASC`,
      [entryId],
    );

    return result.rows.map((row) => this.mapToEntity(row));
  }

  async save(tag: GenreTag): Promise<GenreTag> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if tag exists
      const existing = await client.query('SELECT id FROM genre_tags WHERE id = $1', [tag.id]);

      if (existing.rows.length === 0) {
        // Insert new tag
        await client.query(
          'INSERT INTO genre_tags (id, name) VALUES ($1, $2)',
          [tag.id, tag.name],
        );
      } else {
        // Update existing tag
        await client.query(
          'UPDATE genre_tags SET name = $2 WHERE id = $1',
          [tag.id, tag.name],
        );
      }

      await client.query('COMMIT');
      return tag;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM genre_tags WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async associateWithEntry(entryId: string, tagIds: string[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Remove existing associations
      await client.query('DELETE FROM entry_tags WHERE entry_id = $1', [entryId]);

      // Insert new associations
      if (tagIds.length > 0) {
        const values = tagIds.map((_tagId, index) => {
          const entryParam = index * 2 + 1;
          const tagParam = index * 2 + 2;
          return `($${entryParam}, $${tagParam})`;
        }).join(', ');

        const params = tagIds.flatMap((tagId) => [entryId, tagId]);

        await client.query(
          `INSERT INTO entry_tags (entry_id, tag_id) VALUES ${values}`,
          params,
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removeFromEntry(entryId: string): Promise<void> {
    await this.pool.query('DELETE FROM entry_tags WHERE entry_id = $1', [entryId]);
  }

  private mapToEntity(row: any): GenreTag {
    return new GenreTag({
      id: row.id,
      name: row.name,
    });
  }
}
