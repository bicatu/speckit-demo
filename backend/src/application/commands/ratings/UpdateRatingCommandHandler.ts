import { CommandHandler } from '../CommandHandler';
import { UpdateRatingCommand } from './UpdateRatingCommand';
import { CommandResult } from '../Command';
import { IRatingRepository } from '../../../domain/repositories/IRatingRepository';
import { IEntryRepository } from '../../../domain/repositories/IEntryRepository';

/**
 * Handler for UpdateRatingCommand
 * Updates an existing rating and recalculates entry average
 */
export class UpdateRatingCommandHandler implements CommandHandler<UpdateRatingCommand> {
  constructor(
    private readonly ratingRepository: IRatingRepository,
    private readonly entryRepository: IEntryRepository
  ) {}

  async handle(command: UpdateRatingCommand): Promise<CommandResult> {
    try {
      // Validate stars is a whole number between 1 and 10
      if (!Number.isInteger(command.stars) || command.stars < 1 || command.stars > 10) {
        return {
          success: false,
          error: 'Stars must be a whole number between 1 and 10',
        };
      }

      // Check if entry exists
      const entry = await this.entryRepository.findById(command.entryId);
      if (!entry) {
        return {
          success: false,
          error: 'Entry not found',
        };
      }

      // Check if rating exists
      const existingRating = await this.ratingRepository.findByUserAndEntry(
        command.userId,
        command.entryId
      );

      if (!existingRating) {
        return {
          success: false,
          error: 'Rating not found. Use add instead.',
        };
      }

      // Update rating
      existingRating.updateStars(command.stars);
      await this.ratingRepository.save(existingRating);

      // Update entry's average rating
      await this.updateAverageRating(command.entryId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
