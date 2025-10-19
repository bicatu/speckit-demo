import { Query } from '../Query';

/**
 * Query to retrieve all users pending approval
 * Admin-only query
 */
export class GetPendingUsersQuery implements Query {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor() {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}
