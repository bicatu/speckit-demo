import { QueryHandler } from '../QueryHandler';
import { GetPendingUsersQuery } from './GetPendingUsersQuery';
import { QueryResult } from '../Query';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';

/**
 * User DTO for pending users response
 */
export interface PendingUserDto {
  id: string;
  email: string;
  name: string;
  approvalRequestedAt: Date;
  createdAt: Date;
}

/**
 * Handler for GetPendingUsersQuery
 * Returns list of users with pending approval status
 */
export class GetPendingUsersQueryHandler
  implements QueryHandler<GetPendingUsersQuery, PendingUserDto[]>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(query: GetPendingUsersQuery): Promise<QueryResult<PendingUserDto[]>> {
    try {
      const pendingUsers = await this.userRepository.findPendingUsers();

      const userDtos: PendingUserDto[] = pendingUsers.map((user: User) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        approvalRequestedAt: user.approvalRequestedAt || user.createdAt,
        createdAt: user.createdAt,
      }));

      return {
        success: true,
        data: userDtos,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve pending users',
      };
    }
  }
}
