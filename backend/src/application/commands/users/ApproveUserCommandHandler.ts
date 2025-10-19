import { CommandHandler } from '../CommandHandler';
import { ApproveUserCommand } from './ApproveUserCommand';
import { CommandResult } from '../Command';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class ApproveUserCommandHandler
  implements CommandHandler<ApproveUserCommand>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(command: ApproveUserCommand): Promise<CommandResult> {
    try {
      // 1. Find the user to approve
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
          error: 'Only administrators can approve users',
        };
      }

      // 3. Approve the user (domain logic handles validation)
      user.approve(command.adminUserId);

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
            : 'Failed to approve user',
      };
    }
  }
}
