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
  private _approvalStatus: 'pending' | 'approved' | 'rejected';
  private _approvalRequestedAt: Date | null;
  private _approvedBy: string | null;
  private _rejectedBy: string | null;
  private _approvedAt: Date | null;

  constructor(props: {
    id: string;
    oauthSubject: string;
    email: string;
    name: string;
    isAdmin: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvalRequestedAt: Date | null;
    approvedBy: string | null;
    rejectedBy: string | null;
    approvedAt: Date | null;
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
    this._approvalStatus = props.approvalStatus;
    this._approvalRequestedAt = props.approvalRequestedAt;
    this._approvedBy = props.approvedBy;
    this._rejectedBy = props.rejectedBy;
    this._approvedAt = props.approvedAt;
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

  get approvalStatus(): 'pending' | 'approved' | 'rejected' {
    return this._approvalStatus;
  }

  get approvalRequestedAt(): Date | null {
    return this._approvalRequestedAt;
  }

  get approvedBy(): string | null {
    return this._approvedBy;
  }

  get rejectedBy(): string | null {
    return this._rejectedBy;
  }

  get approvedAt(): Date | null {
    return this._approvedAt;
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

  // Approval workflow methods
  public isPending(): boolean {
    return this._approvalStatus === 'pending';
  }

  public isApproved(): boolean {
    return this._approvalStatus === 'approved';
  }

  public isRejected(): boolean {
    return this._approvalStatus === 'rejected';
  }

  public approve(adminUserId: string): void {
    if (this._approvalStatus === 'approved') {
      throw new Error('User is already approved');
    }
    if (!adminUserId || adminUserId.trim().length === 0) {
      throw new Error('Admin user ID is required for approval');
    }
    this._approvalStatus = 'approved';
    this._approvedBy = adminUserId;
    this._rejectedBy = null;
    this._approvedAt = new Date();
  }

  public reject(adminUserId: string): void {
    if (this._approvalStatus === 'rejected') {
      throw new Error('User is already rejected');
    }
    if (!adminUserId || adminUserId.trim().length === 0) {
      throw new Error('Admin user ID is required for rejection');
    }
    this._approvalStatus = 'rejected';
    this._rejectedBy = adminUserId;
    this._approvedBy = null;
    this._approvedAt = new Date();
  }

  public requestApproval(): void {
    if (this._approvalRequestedAt === null) {
      this._approvalRequestedAt = new Date();
    }
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
