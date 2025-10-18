import { CommandHandler } from '../CommandHandler';
import { CommandResult } from '../Command';
import { DeleteStreamingPlatformCommand } from './DeleteStreamingPlatformCommand';
import { IStreamingPlatformRepository } from '../../../domain/repositories/IStreamingPlatformRepository';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';

export class DeleteStreamingPlatformCommandHandler
  implements CommandHandler<DeleteStreamingPlatformCommand>
{
  constructor(
    private readonly platformRepository: IStreamingPlatformRepository,
    private readonly entryRepository: IEntryRepository
  ) {}

  async handle(command: DeleteStreamingPlatformCommand): Promise<CommandResult> {
    // Check if platform exists
    const platform = await this.platformRepository.findById(command.platformId);
    if (!platform) {
      throw new Error('Platform not found');
    }

    // Check if platform is referenced by any entries (FR-016)
    const entries = await this.entryRepository.findAll({ platformId: command.platformId }, 1, 0);
    if (entries.length > 0) {
      throw new Error('Cannot delete platform that is referenced by entries');
    }

    await this.platformRepository.delete(command.platformId);

    return {
      success: true,
    };
  }
}
