import { Query, QueryResult as QResult } from './Query';

// Re-export QueryResult for convenience
export type QueryResult<TData = unknown> = QResult<TData>;

/**
 * Base interface for all query handlers.
 * Implements the Query Handler pattern - each query has exactly one handler.
 * Handlers retrieve data from repositories without modifying state.
 */
export interface QueryHandler<TQuery extends Query<TResult>, TResult = unknown> {
  /**
   * Execute the query and return result
   * @param query The query to execute
   * @returns Promise resolving to query result with data
   */
  handle(query: TQuery): Promise<QueryResult<TResult>>;
}
