import { CommandHandler } from '../CommandHandler';
import { CommandResult } from '../Command';
import { CreateGenreTagCommand } from './CreateGenreTagCommand';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';
import { GenreTag } from '../../../domain/entities/GenreTag';

export class CreateGenreTagCommandHandler implements CommandHandler<CreateGenreTagCommand> {
  constructor(private readonly genreTagRepository: IGenreTagRepository) {}

  async handle(command: CreateGenreTagCommand): Promise<CommandResult> {
    // Check if tag name already exists
    const existingTag = await this.genreTagRepository.findByName(command.name);
    if (existingTag) {
      throw new Error('Tag already exists');
    }

    const tag = new GenreTag({
      id: crypto.randomUUID(),
      name: command.name,
    });

    await this.genreTagRepository.save(tag);

    return {
      success: true,
      resourceId: tag.id,
    };
  }
}
