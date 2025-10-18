import { CommandHandler } from '../CommandHandler';
import { CommandResult } from '../Command';
import { CreateStreamingPlatformCommand } from './CreateStreamingPlatformCommand';
import { IStreamingPlatformRepository } from '../../../domain/repositories/IStreamingPlatformRepository';
import { StreamingPlatform } from '../../../domain/entities/StreamingPlatform';

export class CreateStreamingPlatformCommandHandler implements CommandHandler<CreateStreamingPlatformCommand> {
  constructor(private readonly streamingPlatformRepository: IStreamingPlatformRepository) {}

  async handle(command: CreateStreamingPlatformCommand): Promise<CommandResult> {
    // Check if platform name already exists
    const existingPlatform = await this.streamingPlatformRepository.findByName(command.name);
    if (existingPlatform) {
      throw new Error('Platform already exists');
    }

    const platform = new StreamingPlatform({
      id: crypto.randomUUID(),
      name: command.name,
    });

    await this.streamingPlatformRepository.save(platform);

    return {
      success: true,
      resourceId: platform.id,
    };
  }
}
