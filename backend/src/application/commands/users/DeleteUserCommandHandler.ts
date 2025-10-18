import { CommandHandler } from '../CommandHandler';
import { DeleteUserCommand } from './DeleteUserCommand';
import { CommandResult } from '../Command';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';
import { IRatingRepository } from '../../../domain/repositories/IRatingRepository';

export class DeleteUserCommandHandler
  implements CommandHandler<DeleteUserCommand>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly entryRepository: IEntryRepository,
    private readonly ratingRepository: IRatingRepository
  ) {}

  async handle(command: DeleteUserCommand): Promise<CommandResult> {
    try {
      // 1. Find the user
      const user = await this.userRepository.findById(command.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // 2. If user is admin, check if they are the last admin (T184a)
      if (user.isAdmin) {
        const adminCount = await this.userRepository.countAdmins();
        if (adminCount <= 1) {
          return {
            success: false,
            error: 'Cannot delete the last admin user',
          };
        }
      }

      // 3. Anonymize user's entries (set creator_id to NULL)
      // This preserves entries per FR-019
      const userEntries = await this.entryRepository.findByCreatorId(
        command.userId
      );
      for (const entry of userEntries) {
        await this.entryRepository.anonymizeCreator(entry.id);
      }

      // 4. Handle ratings - database constraint ON DELETE SET NULL handles this automatically
      // Ratings are preserved with user_id set to NULL per FR-019

      // 5. Delete the user
      await this.userRepository.delete(command.userId);

      return {
        success: true,
        resourceId: command.userId,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete user account',
      };
    }
  }
}
