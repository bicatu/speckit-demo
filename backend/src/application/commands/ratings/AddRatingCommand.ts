import { Command } from '../Command';

/**
 * Command to add a new rating to an entry
 */
export interface AddRatingCommand extends Command {
  userId: string;
  entryId: string;
  stars: number; // 1-10 whole number
}
