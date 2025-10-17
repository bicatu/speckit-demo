import { Command, CommandResult } from './Command';

/**
 * Base interface for all command handlers.
 * Implements the Command Handler pattern - each command has exactly one handler.
 * Handlers orchestrate domain logic and coordinate with repositories.
 */
export interface CommandHandler<TCommand extends Command> {
  /**
   * Execute the command and return result
   * @param command The command to execute
   * @returns Promise resolving to command execution result
   */
  handle(command: TCommand): Promise<CommandResult>;
}
