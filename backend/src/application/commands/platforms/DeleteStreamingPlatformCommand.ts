import { Command } from '../Command';

export class DeleteStreamingPlatformCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly platformId: string;

  constructor(data: { platformId: string }) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();

    if (!data.platformId || data.platformId.trim() === '') {
      throw new Error('Platform ID is required');
    }

    this.platformId = data.platformId;
  }
}
