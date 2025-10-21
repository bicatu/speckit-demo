import { Command } from '../Command';

export class DeleteUserCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly userId: string;

  constructor(userId: string) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }

    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = userId;
  }
}
