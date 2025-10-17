/**
 * StreamingPlatform entity - represents a streaming service platform
 */
export class StreamingPlatform {
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

  public equals(other: StreamingPlatform): boolean {
    if (!other || !(other instanceof StreamingPlatform)) {
      return false;
    }
    return this._id === other._id;
  }

  // Validation methods
  private validateName(name: string): void {
    if (!name || name.length === 0) {
      throw new Error('Platform name cannot be empty');
    }
    if (name.length > 50) {
      throw new Error('Platform name cannot exceed 50 characters');
    }
  }
}
