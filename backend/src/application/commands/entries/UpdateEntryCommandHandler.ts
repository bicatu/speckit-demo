import { CommandHandler } from '../CommandHandler';
import { UpdateEntryCommand } from './UpdateEntryCommand';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';

export class UpdateEntryCommandHandler implements CommandHandler<UpdateEntryCommand, void> {
  constructor(
    private readonly entryRepository: IEntryRepository,
    private readonly genreTagRepository: IGenreTagRepository
  ) {}

  async handle(command: UpdateEntryCommand): Promise<void> {
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

    const updatedEntry = {
      ...existingEntry,
      title: command.title ?? existingEntry.title,
      mediaType: command.mediaType ?? existingEntry.mediaType,
      platformId: command.platformId !== undefined ? command.platformId : existingEntry.platformId,
      updatedAt: new Date(),
    };

    await this.entryRepository.update(updatedEntry);

    if (command.tagIds) {
      await this.entryRepository.updateTags(command.entryId, command.tagIds);
    }
  }
}
