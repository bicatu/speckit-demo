import { Pool } from 'pg';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

/**
 * PostgreSQL implementation of IUserRepository
 */
export class PostgresUserRepository implements IUserRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, oauth_subject, email, name, is_admin, last_login, created_at
       FROM users WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByOAuthSubject(oauthSubject: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, oauth_subject, email, name, is_admin, last_login, created_at
       FROM users WHERE oauth_subject = $1`,
      [oauthSubject],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, oauth_subject, email, name, is_admin, last_login, created_at
       FROM users WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findAll(isAdmin?: boolean): Promise<User[]> {
    let query = `SELECT id, oauth_subject, email, name, is_admin, last_login, created_at
                 FROM users`;
    const params: any[] = [];

    if (isAdmin !== undefined) {
      query += ' WHERE is_admin = $1';
      params.push(isAdmin);
    }

    query += ' ORDER BY name ASC';

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async save(user: User): Promise<User> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user exists
      const existing = await client.query('SELECT id FROM users WHERE id = $1', [user.id]);

      if (existing.rows.length === 0) {
        // Insert new user
        await client.query(
          `INSERT INTO users (id, oauth_subject, email, name, is_admin, last_login, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            user.id,
            user.oauthSubject,
            user.email,
            user.name,
            user.isAdmin,
            user.lastLogin,
            user.createdAt,
          ],
        );
      } else {
        // Update existing user
        await client.query(
          `UPDATE users 
           SET oauth_subject = $2, email = $3, name = $4, is_admin = $5, last_login = $6
           WHERE id = $1`,
          [user.id, user.oauthSubject, user.email, user.name, user.isAdmin, user.lastLogin],
        );
      }

      await client.query('COMMIT');
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async existsByOAuthSubject(oauthSubject: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM users WHERE oauth_subject = $1',
      [oauthSubject],
    );
    return result.rows.length > 0;
  }

  async countAdmins(): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = true'
    );
    return parseInt(result.rows[0].count, 10);
  }

  async updateLastLogin(id: string, lastLogin: Date): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE users SET last_login = $2 WHERE id = $1',
      [id, lastLogin],
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  private mapToEntity(row: any): User {
    return new User({
      id: row.id,
      oauthSubject: row.oauth_subject,
      email: row.email,
      name: row.name,
      isAdmin: row.is_admin,
      lastLogin: row.last_login ? new Date(row.last_login) : null,
      createdAt: new Date(row.created_at),
    });
  }
}
