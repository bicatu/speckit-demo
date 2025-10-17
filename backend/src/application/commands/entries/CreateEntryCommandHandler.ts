import { CommandHandler } from '../CommandHandler';
import { CommandResult } from '../Command';
import { CreateEntryCommand } from './CreateEntryCommand';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../domain/repositories/IGenreTagRepository';
import { IRatingRepository } from '../../../domain/repositories/IRatingRepository';
import { Entry } from '../../../domain/entities/Entry';
import { Rating } from '../../../domain/entities/Rating';

/**
 * Handler for CreateEntryCommand
 * Creates a new entry with title uniqueness validation
 */
export class CreateEntryCommandHandler implements CommandHandler<CreateEntryCommand> {
  constructor(
    private readonly entryRepository: IEntryRepository,
    private readonly genreTagRepository: IGenreTagRepository,
    private readonly ratingRepository: IRatingRepository
  ) {}

  async handle(command: CreateEntryCommand): Promise<CommandResult> {
    try {
      // FR-003: Check title uniqueness
      const existingEntry = await this.entryRepository.findByTitle(command.title);
      if (existingEntry) {
        return {
          success: false,
          error: 'Entry with this title already exists'
        };
      }

      // Validate that all tags exist
      const tags = await this.genreTagRepository.findByIds(command.tagIds);
      if (tags.length !== command.tagIds.length) {
        return {
          success: false,
          error: 'One or more tags do not exist'
        };
      }

      // Create the entry
      const now = new Date();
      const entryId = crypto.randomUUID();
      const entry = new Entry({
        id: entryId,
        title: command.title,
        mediaType: command.mediaType,
        creatorId: command.userId,
        platformId: command.platformId || null,
        averageRating: null,
        createdAt: now,
        updatedAt: now
      });

      // Save the entry
      const savedEntry = await this.entryRepository.save(entry);

      // Associate tags with the entry
      await this.genreTagRepository.associateWithEntry(savedEntry.id, command.tagIds);

      // If initial rating provided, create it
      if (command.initialRating !== undefined) {
        const rating = new Rating({
          userId: command.userId,
          entryId: savedEntry.id,
          stars: command.initialRating,
          createdAt: now,
          updatedAt: now
        });

        await this.ratingRepository.save(rating);

        // Update entry's average rating
        savedEntry.updateAverageRating(command.initialRating);
        await this.entryRepository.save(savedEntry);
      }

      return {
        success: true,
        resourceId: savedEntry.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
