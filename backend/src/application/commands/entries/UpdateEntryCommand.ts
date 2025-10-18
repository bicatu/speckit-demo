import { Command } from '../Command';

export class UpdateEntryCommand implements Command {
  public readonly entryId: string;
  public readonly title?: string;
  public readonly mediaType?: 'film' | 'series';
  public readonly platformId?: string;
  public readonly tagIds?: string[];

  constructor(data: {
    entryId: string;
    title?: string;
    mediaType?: 'film' | 'series';
    platformId?: string;
    tagIds?: string[];
  }) {
    if (!data.entryId || data.entryId.trim() === '') {
      throw new Error('Entry ID is required');
    }

    if (data.title !== undefined && data.title.trim() === '') {
      throw new Error('Title cannot be empty');
    }

    if (data.mediaType !== undefined && !['film', 'series'].includes(data.mediaType)) {
      throw new Error('Media type must be either "film" or "series"');
    }

    if (data.tagIds !== undefined && (data.tagIds.length < 1 || data.tagIds.length > 3)) {
      throw new Error('Tag IDs must have between 1 and 3 elements');
    }

    if (
      !data.title &&
      !data.mediaType &&
      !data.platformId &&
      !data.tagIds
    ) {
      throw new Error('At least one field must be provided for update');
    }

    this.entryId = data.entryId;
    this.title = data.title;
    this.mediaType = data.mediaType;
    this.platformId = data.platformId;
    this.tagIds = data.tagIds;
  }
}
