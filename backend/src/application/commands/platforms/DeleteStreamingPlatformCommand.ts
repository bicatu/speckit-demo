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

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.platformId)) {
      throw new Error('Platform ID must be a valid UUID');
    }

    this.platformId = data.platformId;
  }
}
