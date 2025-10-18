import { CommandHandler } from '../CommandHandler';
import { CommandResult } from '../Command';
import { DeleteGenreTagCommand } from './DeleteGenreTagCommand';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';

export class DeleteGenreTagCommandHandler implements CommandHandler<DeleteGenreTagCommand> {
  constructor(
    private readonly genreTagRepository: IGenreTagRepository,
    private readonly entryRepository: IEntryRepository
  ) {}

  async handle(command: DeleteGenreTagCommand): Promise<CommandResult> {
    // Check if tag exists
    const tag = await this.genreTagRepository.findById(command.tagId);
    if (!tag) {
      throw new Error('Tag not found');
    }

    // Check if tag is referenced by any entries (FR-017)
    const entries = await this.entryRepository.findAll({ tagIds: [command.tagId] }, 1, 0);
    if (entries.length > 0) {
      throw new Error('Cannot delete tag that is referenced by entries');
    }

    await this.genreTagRepository.delete(command.tagId);

    return {
      success: true,
    };
  }
}
