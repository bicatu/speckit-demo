import { Pool } from 'pg';
import { IRatingRepository } from '../../domain/repositories/IRatingRepository';
import { Rating } from '../../domain/entities/Rating';

/**
 * PostgreSQL implementation of IRatingRepository
 */
export class PostgresRatingRepository implements IRatingRepository {
  constructor(private pool: Pool) {}

  async findByUserAndEntry(userId: string, entryId: string): Promise<Rating | null> {
    const result = await this.pool.query(
      `SELECT user_id, entry_id, stars, created_at, updated_at
       FROM ratings WHERE user_id = $1 AND entry_id = $2`,
      [userId, entryId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByEntryId(entryId: string): Promise<Rating[]> {
    const result = await this.pool.query(
      `SELECT user_id, entry_id, stars, created_at, updated_at
       FROM ratings WHERE entry_id = $1
       ORDER BY created_at DESC`,
      [entryId],
    );

    return result.rows.map((row) => this.mapToEntity(row));
  }

  async findByUserId(userId: string): Promise<Rating[]> {
    const result = await this.pool.query(
      `SELECT user_id, entry_id, stars, created_at, updated_at
       FROM ratings WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows.map((row) => this.mapToEntity(row));
  }

  async save(rating: Rating): Promise<Rating> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if rating exists
      const existing = await client.query(
        'SELECT user_id FROM ratings WHERE user_id = $1 AND entry_id = $2',
        [rating.userId, rating.entryId],
      );

      if (existing.rows.length === 0) {
        // Insert new rating
        await client.query(
          `INSERT INTO ratings (user_id, entry_id, stars, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [rating.userId, rating.entryId, rating.stars, rating.createdAt, rating.updatedAt],
        );
      } else {
        // Update existing rating
        await client.query(
          `UPDATE ratings SET stars = $3, updated_at = $4
           WHERE user_id = $1 AND entry_id = $2`,
          [rating.userId, rating.entryId, rating.stars, rating.updatedAt],
        );
      }

      // Update entry's average rating
      const avgResult = await client.query(
        `SELECT AVG(stars)::DECIMAL(3,2) as avg_rating
         FROM ratings WHERE entry_id = $1`,
        [rating.entryId],
      );

      const avgRating = avgResult.rows[0].avg_rating
        ? parseFloat(avgResult.rows[0].avg_rating)
        : null;

      await client.query('UPDATE entries SET average_rating = $1 WHERE id = $2', [
        avgRating,
        rating.entryId,
      ]);

      await client.query('COMMIT');
      return rating;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(userId: string, entryId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'DELETE FROM ratings WHERE user_id = $1 AND entry_id = $2',
        [userId, entryId],
      );

      // Update entry's average rating after deletion
      const avgResult = await client.query(
        `SELECT AVG(stars)::DECIMAL(3,2) as avg_rating
         FROM ratings WHERE entry_id = $1`,
        [entryId],
      );

      const avgRating = avgResult.rows[0].avg_rating
        ? parseFloat(avgResult.rows[0].avg_rating)
        : null;

      await client.query('UPDATE entries SET average_rating = $1 WHERE id = $2', [
        avgRating,
        entryId,
      ]);

      await client.query('COMMIT');
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async calculateAverageForEntry(entryId: string): Promise<number | null> {
    const result = await this.pool.query(
      `SELECT AVG(stars)::DECIMAL(3,2) as avg_rating
       FROM ratings WHERE entry_id = $1`,
      [entryId],
    );

    return result.rows[0].avg_rating ? parseFloat(result.rows[0].avg_rating) : null;
  }

  async countByEntryId(entryId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as total FROM ratings WHERE entry_id = $1',
      [entryId],
    );

    return parseInt(result.rows[0].total, 10);
  }

  private mapToEntity(row: any): Rating {
    return new Rating({
      userId: row.user_id,
      entryId: row.entry_id,
      stars: row.stars,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
