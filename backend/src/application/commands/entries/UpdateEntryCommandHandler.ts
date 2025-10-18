import { CommandHandler } from '../CommandHandler';
import { CommandResult } from '../Command';
import { UpdateEntryCommand } from './UpdateEntryCommand';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';

export class UpdateEntryCommandHandler implements CommandHandler<UpdateEntryCommand> {
  constructor(
    private readonly entryRepository: IEntryRepository,
    private readonly genreTagRepository: IGenreTagRepository
  ) {}

  async handle(command: UpdateEntryCommand): Promise<CommandResult> {
    const existingEntry = await this.entryRepository.findById(command.entryId);

    if (!existingEntry) {
      throw new Error('Entry not found');
    }

    if (command.title && command.title !== existingEntry.title) {
      const conflictingEntry = await this.entryRepository.findByTitle(command.title);
      if (conflictingEntry && conflictingEntry.id !== command.entryId) {
        throw new Error('Title already exists');
      }
    }

    if (command.tagIds) {
      const tags = await this.genreTagRepository.findByIds(command.tagIds);
      if (tags.length !== command.tagIds.length) {
        throw new Error('One or more tags not found');
      }
    }

    // Update entity using domain methods
    if (command.title) {
      existingEntry.updateTitle(command.title);
    }

    if (command.platformId !== undefined) {
      existingEntry.updatePlatform(command.platformId);
    }

    // Note: mediaType updates not supported by domain entity currently
    // This would require adding updateMediaType method to Entry entity

    await this.entryRepository.update(existingEntry);

    if (command.tagIds) {
      await this.entryRepository.updateTags(command.entryId, command.tagIds);
    }

    return {
      success: true,
      resourceId: command.entryId,
    };
  }
}
