/**
 * Entry entity - represents a movie or series in the system
 * Aggregate root for the Entry bounded context
 */
export class Entry {
  private _id: string;
  private _title: string;
  private _mediaType: 'film' | 'series';
  private _creatorId: string | null;
  private _platformId: string | null;
  private _averageRating: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    id: string;
    title: string;
    mediaType: 'film' | 'series';
    creatorId: string | null;
    platformId: string | null;
    averageRating: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.validateTitle(props.title);
    this.validateMediaType(props.mediaType);
    if (props.averageRating !== null) {
      this.validateAverageRating(props.averageRating);
    }

    this._id = props.id;
    this._title = props.title;
    this._mediaType = props.mediaType;
    this._creatorId = props.creatorId;
    this._platformId = props.platformId;
    this._averageRating = props.averageRating;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get mediaType(): 'film' | 'series' {
    return this._mediaType;
  }

  get creatorId(): string | null {
    return this._creatorId;
  }

  get platformId(): string | null {
    return this._platformId;
  }

  get averageRating(): number | null {
    return this._averageRating;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  public updateTitle(newTitle: string): void {
    this.validateTitle(newTitle);
    this._title = newTitle;
    this._updatedAt = new Date();
  }

  public updateMediaType(mediaType: 'film' | 'series'): void {
    this.validateMediaType(mediaType);
    this._mediaType = mediaType;
    this._updatedAt = new Date();
  }

  public updatePlatform(platformId: string | null): void {
    this._platformId = platformId;
    this._updatedAt = new Date();
  }

  public updateAverageRating(rating: number | null): void {
    if (rating !== null) {
      this.validateAverageRating(rating);
    }
    this._averageRating = rating;
  }

  // Validation methods
  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (title.length > 200) {
      throw new Error('Title cannot exceed 200 characters');
    }
  }

  private validateMediaType(mediaType: string): void {
    if (mediaType !== 'film' && mediaType !== 'series') {
      throw new Error('Media type must be either "film" or "series"');
    }
  }

  private validateAverageRating(rating: number): void {
    if (rating < 1 || rating > 10) {
      throw new Error('Average rating must be between 1 and 10');
    }
  }
}
