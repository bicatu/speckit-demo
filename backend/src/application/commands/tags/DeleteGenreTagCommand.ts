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

    this.tagId = data.tagId;
  }
}
