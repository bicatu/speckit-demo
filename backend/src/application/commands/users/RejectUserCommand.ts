import { Command } from '../Command';

export class RejectUserCommand implements Command {
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

    // Validate UUID format for both IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('userId must be a valid UUID');
    }
    if (!uuidRegex.test(adminUserId)) {
      throw new Error('adminUserId must be a valid UUID');
    }

    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = userId;
    this.adminUserId = adminUserId;
  }
}
