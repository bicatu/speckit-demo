import { CommandHandler } from '../CommandHandler';
import { AddRatingCommand } from './AddRatingCommand';
import { CommandResult } from '../Command';
import { IRatingRepository } from '../../../domain/repositories/IRatingRepository';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';
import { Rating } from '../../../domain/entities/Rating';

/**
 * Handler for AddRatingCommand
 * Creates a new rating and updates the entry's average rating
 */
export class AddRatingCommandHandler implements CommandHandler<AddRatingCommand> {
  constructor(
    private readonly ratingRepository: IRatingRepository,
    private readonly entryRepository: IEntryRepository,
  ) {}

  async handle(command: AddRatingCommand): Promise<CommandResult> {
    try {
      // Check if entry exists
      const entry = await this.entryRepository.findById(command.entryId);
      if (!entry) {
        return {
          success: false,
          error: 'Entry not found',
        };
      }

      // Check if user already has a rating for this entry
      const existingRating = await this.ratingRepository.findByUserAndEntry(
        command.userId,
        command.entryId,
      );

      if (existingRating) {
        return {
          success: false,
          error: 'User has already rated this entry. Use update instead.',
        };
      }

      // Create new rating
      const rating = new Rating({
        userId: command.userId,
        entryId: command.entryId,
        stars: command.stars,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.ratingRepository.save(rating);

      // Update entry's average rating
      await this.updateAverageRating(command.entryId);

      return {
        success: true,
        resourceId: `${command.userId}-${command.entryId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add rating',
      };
    }
  }

  private async updateAverageRating(entryId: string): Promise<void> {
    const ratings = await this.ratingRepository.findByEntryId(entryId);
    
    if (ratings.length === 0) {
      return;
    }

    const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    const average = sum / ratings.length;

    // Update entry's average rating
    const entry = await this.entryRepository.findById(entryId);
    if (entry) {
      entry.updateAverageRating(parseFloat(average.toFixed(2)));
      await this.entryRepository.save(entry);
    }
  }
}
