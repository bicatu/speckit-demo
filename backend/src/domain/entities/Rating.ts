/**
 * Rating entity - represents a user's rating for an entry
 */
export class Rating {
  private _userId: string;
  private _entryId: string;
  private _stars: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    userId: string;
    entryId: string;
    stars: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.validateStars(props.stars);

    this._userId = props.userId;
    this._entryId = props.entryId;
    this._stars = props.stars;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get entryId(): string {
    return this._entryId;
  }

  get stars(): number {
    return this._stars;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  public updateStars(newStars: number): void {
    this.validateStars(newStars);
    this._stars = newStars;
    this._updatedAt = new Date();
  }

  // Validation methods
  private validateStars(stars: number): void {
    if (!Number.isInteger(stars)) {
      throw new Error('Rating must be an integer');
    }
    if (stars < 1 || stars > 10) {
      throw new Error('Rating must be between 1 and 10');
    }
  }
}
