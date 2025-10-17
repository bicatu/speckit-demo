/**
 * GenreTag entity - represents a genre classification tag
 * Value object in the Entry bounded context
 */
export class GenreTag {
  private _id: string;
  private _name: string;

  constructor(props: { id: string; name: string }) {
    const trimmedName = props.name.trim();
    this.validateName(trimmedName);

    this._id = props.id;
    this._name = trimmedName;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  // Business methods
  public updateName(newName: string): void {
    const trimmedName = newName.trim();
    this.validateName(trimmedName);
    this._name = trimmedName;
  }

  public equals(other: GenreTag): boolean {
    if (!other || !(other instanceof GenreTag)) {
      return false;
    }
    return this._id === other._id;
  }

  // Validation methods
  private validateName(name: string): void {
    if (!name || name.length === 0) {
      throw new Error('Genre tag name cannot be empty');
    }
    if (name.length > 30) {
      throw new Error('Genre tag name cannot exceed 30 characters');
    }
  }
}
