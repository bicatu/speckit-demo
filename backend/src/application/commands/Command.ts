/**
 * Base interface for all commands in the system.
 * Commands represent write operations that change system state.
 * Following CQRS pattern - commands do not return data, only success/failure.
 */
export interface Command {
  /**
   * Unique identifier for tracing and debugging
   */
  readonly commandId: string;

  /**
   * Timestamp when command was created
   */
  readonly timestamp: Date;
}

/**
 * Result of command execution
 */
export interface CommandResult {
  /**
   * Indicates if command executed successfully
   */
  success: boolean;

  /**
   * Error message if command failed
   */
  error?: string;

  /**
   * ID of created/modified resource (if applicable)
   */
  resourceId?: string;
}
