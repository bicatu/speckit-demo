import { Command } from '../Command';

export class DeleteGenreTagCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly tagId: string;

  constructor(data: { tagId: string }) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();

    if (!data.tagId || data.tagId.trim() === '') {
      throw new Error('Tag ID is required');
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.tagId)) {
      throw new Error('Tag ID must be a valid UUID');
    }

    this.tagId = data.tagId;
  }
}
