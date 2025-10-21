import { Command } from '../Command';

export class ApproveUserCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly userId: string;
  public readonly adminUserId: string;

  constructor(userId: string, adminUserId: string) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }

    if (!adminUserId || typeof adminUserId !== 'string') {
      throw new Error('adminUserId must be a non-empty string');
    }

    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = userId;
    this.adminUserId = adminUserId;
  }
}
