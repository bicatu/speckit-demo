/**
 * User entity - represents a registered user in the system
 */
export class User {
  private _id: string;
  private _oauthSubject: string;
  private _email: string;
  private _name: string;
  private _isAdmin: boolean;
  private _lastLogin: Date | null;
  private _createdAt: Date;

  constructor(props: {
    id: string;
    oauthSubject: string;
    email: string;
    name: string;
    isAdmin: boolean;
    lastLogin: Date | null;
    createdAt: Date;
  }) {
    this.validateEmail(props.email);
    this.validateName(props.name);
    this.validateOAuthSubject(props.oauthSubject);

    this._id = props.id;
    this._oauthSubject = props.oauthSubject;
    this._email = props.email;
    this._name = props.name;
    this._isAdmin = props.isAdmin;
    this._lastLogin = props.lastLogin;
    this._createdAt = props.createdAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get oauthSubject(): string {
    return this._oauthSubject;
  }

  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }

  get lastLogin(): Date | null {
    return this._lastLogin;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Business methods
  public updateName(newName: string): void {
    this.validateName(newName);
    this._name = newName;
  }

  public updateEmail(newEmail: string): void {
    this.validateEmail(newEmail);
    this._email = newEmail;
  }

  public recordLogin(): void {
    this._lastLogin = new Date();
  }

  public grantAdminPrivileges(): void {
    this._isAdmin = true;
  }

  public revokeAdminPrivileges(): void {
    this._isAdmin = false;
  }

  // Validation methods
  private validateOAuthSubject(subject: string): void {
    if (!subject || subject.trim().length === 0) {
      throw new Error('OAuth subject cannot be empty');
    }
    if (subject.length > 255) {
      throw new Error('OAuth subject cannot exceed 255 characters');
    }
  }

  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }
    if (email.length > 255) {
      throw new Error('Email cannot exceed 255 characters');
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }
  }
}
