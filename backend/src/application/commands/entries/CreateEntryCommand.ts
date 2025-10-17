import { Command } from '../Command';

/**
 * Command to create a new entry (movie or series)
 */
export class CreateEntryCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly mediaType: 'film' | 'series',
    public readonly tagIds: string[],
    public readonly platformId?: string,
    public readonly initialRating?: number
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();

    // Validate tag count (1-3 tags required)
    if (tagIds.length < 1 || tagIds.length > 3) {
      throw new Error('Entry must have between 1 and 3 genre tags');
    }

    // Validate initial rating if provided
    if (initialRating !== undefined && (initialRating < 1 || initialRating > 10)) {
      throw new Error('Initial rating must be between 1 and 10');
    }
  }
}
