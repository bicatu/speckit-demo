import { Command } from '../Command';

export class CreateGenreTagCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly name: string;

  constructor(data: { name: string }) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();

    if (!data.name || data.name.trim() === '') {
      throw new Error('Tag name is required');
    }

    this.name = data.name.trim();
  }
}
