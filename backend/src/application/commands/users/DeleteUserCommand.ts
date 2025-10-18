import { Command } from '../Command';

export class DeleteUserCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly userId: string;

  constructor(userId: string) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('userId must be a valid UUID');
    }

    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = userId;
  }
}
