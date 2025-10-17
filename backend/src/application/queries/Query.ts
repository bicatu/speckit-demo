/**
 * Base interface for all queries in the system.
 * Queries represent read operations that do not modify state.
 * Following CQRS pattern - queries only read data, never write.
 */
export interface Query<TResult = unknown> {
  /**
   * Unique identifier for tracing and debugging
   */
  readonly queryId: string;

  /**
   * Timestamp when query was created
   */
  readonly timestamp: Date;
}

/**
 * Generic result wrapper for query execution
 */
export interface QueryResult<TData = unknown> {
  /**
   * Indicates if query executed successfully
   */
  success: boolean;

  /**
   * Retrieved data (if successful)
   */
  data?: TData;

  /**
   * Error message if query failed
   */
  error?: string;
}
