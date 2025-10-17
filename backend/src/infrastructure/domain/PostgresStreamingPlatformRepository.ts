import { Pool } from 'pg';
import { IStreamingPlatformRepository } from '../../domain/repositories/IStreamingPlatformRepository';
import { StreamingPlatform } from '../../domain/entities/StreamingPlatform';

/**
 * PostgreSQL implementation of IStreamingPlatformRepository
 */
export class PostgresStreamingPlatformRepository implements IStreamingPlatformRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<StreamingPlatform | null> {
    const result = await this.pool.query(
      'SELECT id, name FROM streaming_platforms WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByName(name: string): Promise<StreamingPlatform | null> {
    const result = await this.pool.query(
      'SELECT id, name FROM streaming_platforms WHERE name = $1',
      [name],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findAll(): Promise<StreamingPlatform[]> {
    const result = await this.pool.query(
      'SELECT id, name FROM streaming_platforms ORDER BY name ASC',
    );

    return result.rows.map((row) => this.mapToEntity(row));
  }

  async save(platform: StreamingPlatform): Promise<StreamingPlatform> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if platform exists
      const existing = await client.query(
        'SELECT id FROM streaming_platforms WHERE id = $1',
        [platform.id],
      );

      if (existing.rows.length === 0) {
        // Insert new platform
        await client.query(
          'INSERT INTO streaming_platforms (id, name) VALUES ($1, $2)',
          [platform.id, platform.name],
        );
      } else {
        // Update existing platform
        await client.query(
          'UPDATE streaming_platforms SET name = $2 WHERE id = $1',
          [platform.id, platform.name],
        );
      }

      await client.query('COMMIT');
      return platform;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM streaming_platforms WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  private mapToEntity(row: any): StreamingPlatform {
    return new StreamingPlatform({
      id: row.id,
      name: row.name,
    });
  }
}
