import { Command } from '../Command';

/**
 * Command to update an existing rating
 */
export interface UpdateRatingCommand extends Command {
  userId: string;
  entryId: string;
  stars: number; // 1-10 whole number
}
