import { Command } from '../Command';

/**
 * Command to update an existing rating
 */
export class UpdateRatingCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly userId: string,
    public readonly entryId: string,
    public readonly stars: number
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }

    // Validate entryId
    if (!entryId || typeof entryId !== 'string') {
      throw new Error('entryId must be a non-empty string');
    }

    // Validate stars range (1-10)
    if (!Number.isInteger(stars) || stars < 1 || stars > 10) {
      throw new Error('stars must be a whole number between 1 and 10');
    }
  }
}
