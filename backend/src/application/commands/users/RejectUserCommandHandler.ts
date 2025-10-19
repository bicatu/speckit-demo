import { CommandHandler } from '../CommandHandler';
import { RejectUserCommand } from './RejectUserCommand';
import { CommandResult } from '../Command';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class RejectUserCommandHandler
  implements CommandHandler<RejectUserCommand>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(command: RejectUserCommand): Promise<CommandResult> {
    try {
      // 1. Find the user to reject
      const user = await this.userRepository.findById(command.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // 2. Verify admin user exists and has admin privileges
      const adminUser = await this.userRepository.findById(command.adminUserId);
      if (!adminUser) {
        return {
          success: false,
          error: 'Admin user not found',
        };
      }

      if (!adminUser.isAdmin) {
        return {
          success: false,
          error: 'Only administrators can reject users',
        };
      }

      // 3. Reject the user (domain logic handles validation)
      user.reject(command.adminUserId);

      // 4. Save the updated user
      await this.userRepository.save(user);

      return {
        success: true,
        resourceId: user.id,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reject user',
      };
    }
  }
}
