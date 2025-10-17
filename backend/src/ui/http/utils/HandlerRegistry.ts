import { Context } from 'koa';
import { CommandHandler } from '../../application/commands/CommandHandler';
import { QueryHandler } from '../../application/queries/QueryHandler';

/**
 * Type for HTTP action handlers
 * Actions process HTTP requests and produce responses
 */
export type ActionHandler = (ctx: Context) => Promise<void>;

/**
 * Registry for mapping commands/queries to their handlers
 * Implements a simple service locator pattern for dependency injection
 */
export class HandlerRegistry {
  private static commandHandlers = new Map<string, CommandHandler<any>>();
  private static queryHandlers = new Map<string, QueryHandler<any, any>>();

  /**
   * Register a command handler
   * @param commandName Unique name identifying the command
   * @param handler Command handler instance
   */
  public static registerCommand(commandName: string, handler: CommandHandler<any>): void {
    if (HandlerRegistry.commandHandlers.has(commandName)) {
      throw new Error(`Command handler already registered: ${commandName}`);
    }
    HandlerRegistry.commandHandlers.set(commandName, handler);
  }

  /**
   * Register a query handler
   * @param queryName Unique name identifying the query
   * @param handler Query handler instance
   */
  public static registerQuery(queryName: string, handler: QueryHandler<any, any>): void {
    if (HandlerRegistry.queryHandlers.has(queryName)) {
      throw new Error(`Query handler already registered: ${queryName}`);
    }
    HandlerRegistry.queryHandlers.set(queryName, handler);
  }

  /**
   * Get command handler by name
   * @param commandName Unique command identifier
   * @returns Registered command handler
   */
  public static getCommandHandler<THandler extends CommandHandler<any>>(
    commandName: string,
  ): THandler {
    const handler = HandlerRegistry.commandHandlers.get(commandName);
    if (!handler) {
      throw new Error(`Command handler not found: ${commandName}`);
    }
    return handler as THandler;
  }

  /**
   * Get query handler by name
   * @param queryName Unique query identifier
   * @returns Registered query handler
   */
  public static getQueryHandler<THandler extends QueryHandler<any, any>>(
    queryName: string,
  ): THandler {
    const handler = HandlerRegistry.queryHandlers.get(queryName);
    if (!handler) {
      throw new Error(`Query handler not found: ${queryName}`);
    }
    return handler as THandler;
  }

  /**
   * Clear all registered handlers (useful for testing)
   */
  public static clear(): void {
    HandlerRegistry.commandHandlers.clear();
    HandlerRegistry.queryHandlers.clear();
  }
}
