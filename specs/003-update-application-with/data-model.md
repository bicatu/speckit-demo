# Data Model: Home Page Authentication & Admin Management

**Date**: October 19, 2025  
**Feature**: Home Page Authentication & Admin Management

## Overview

This document defines the data model extensions required for the home page authentication and admin management feature. The existing User entity is extended to support approval workflow, and email notifications are added for admin communication.

## Entity Changes

### User Entity (EXTENDED)

**Location**: `backend/src/domain/entities/User.ts`

**New Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| approvalStatus | `'pending' \| 'approved' \| 'rejected'` | Yes | `'pending'` | User approval state |
| approvalRequestedAt | `Date \| null` | No | `null` | Timestamp when user first requested access |
| approvedBy | `string \| null` | No | `null` | User ID of admin who approved the request |
| rejectedBy | `string \| null` | No | `null` | User ID of admin who rejected the request |
| approvedAt | `Date \| null` | No | `null` | Timestamp when approval/rejection decision was made |

**Updated Constructor**:

```typescript
constructor(props: {
  id: string;
  oauthSubject: string;
  email: string;
  name: string;
  isAdmin: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  // NEW FIELDS
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalRequestedAt: Date | null;
  approvedBy: string | null;
  rejectedBy: string | null;
  approvedAt: Date | null;
})
```

**New Business Methods**:

```typescript
// Check approval state
public isPending(): boolean {
  return this._approvalStatus === 'pending';
}

public isApproved(): boolean {
  return this._approvalStatus === 'approved';
}

public isRejected(): boolean {
  return this._approvalStatus === 'rejected';
}

// State transitions
public approve(adminUserId: string): void {
  if (this._approvalStatus === 'approved') {
    throw new Error('User is already approved');
  }
  this._approvalStatus = 'approved';
  this._approvedBy = adminUserId;
  this._approvedAt = new Date();
}

public reject(adminUserId: string): void {
  if (this._approvalStatus === 'rejected') {
    throw new Error('User is already rejected');
  }
  this._approvalStatus = 'rejected';
  this._rejectedBy = adminUserId;
  this._approvedAt = new Date();
}

public requestApproval(): void {
  if (this._approvalRequestedAt === null) {
    this._approvalRequestedAt = new Date();
  }
}
```

**Validation Rules**:

- `approvalStatus`: Must be one of 'pending', 'approved', 'rejected'
- `approvedBy`: Must be a valid UUID if not null
- `approvedAt`: Must be after `approvalRequestedAt` if both are set
- State transitions: Only pending → approved/rejected allowed

**Existing Fields** (unchanged):

- `id`: string (UUID)
- `oauthSubject`: string
- `email`: string
- `name`: string
- `isAdmin`: boolean
- `lastLogin`: Date | null
- `createdAt`: Date

## Database Schema

### Users Table Migration

**File**: `backend/src/infrastructure/persistence/migrations/005_add_user_approval_status.sql`

```sql
-- Create enum type for approval status
CREATE TYPE user_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN approval_status user_approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN approval_requested_at TIMESTAMP,
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN rejected_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMP;

-- Create index for efficient querying of pending users
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_users_approval_requested_at ON users(approval_requested_at);

-- Set existing users to approved status (backward compatibility)
UPDATE users 
SET approval_status = 'approved', 
    approved_at = created_at 
WHERE approval_status = 'pending';

-- Add check constraint
ALTER TABLE users
  ADD CONSTRAINT chk_approval_consistency 
  CHECK (
    (approval_status = 'pending' AND approved_by IS NULL AND rejected_by IS NULL AND approved_at IS NULL)
    OR
    (approval_status = 'approved' AND approved_by IS NOT NULL AND rejected_by IS NULL AND approved_at IS NOT NULL)
    OR
    (approval_status = 'rejected' AND approved_by IS NULL AND rejected_by IS NOT NULL AND approved_at IS NOT NULL)
  );
```

**Rollback Script**:

```sql
-- Remove constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_approval_consistency;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_approval_requested_at;
DROP INDEX IF EXISTS idx_users_approval_status;

-- Remove columns
ALTER TABLE users 
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS rejected_by,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS approval_requested_at,
  DROP COLUMN IF EXISTS approval_status;

-- Drop enum type
DROP TYPE IF EXISTS user_approval_status;
```

## Repository Interface Updates

### IUserRepository (EXTENDED)

**Location**: `backend/src/domain/repositories/IUserRepository.ts`

**New Methods**:

```typescript
export interface IUserRepository {
  // Existing methods...
  findById(id: string): Promise<User | null>;
  findByOAuthSubject(oauthSubject: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filters?: { isAdmin?: boolean }): Promise<User[]>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  countAdmins(): Promise<number>;

  // NEW METHODS
  findPendingUsers(): Promise<User[]>;
  findByApprovalStatus(status: 'pending' | 'approved' | 'rejected'): Promise<User[]>;
  countPendingUsers(): Promise<number>;
}
```

**Method Specifications**:

- `findPendingUsers()`: Returns all users with approval_status = 'pending', ordered by approval_requested_at DESC
- `findByApprovalStatus(status)`: Returns all users with the specified approval status
- `countPendingUsers()`: Returns count of users with approval_status = 'pending'

## Value Objects

### Email Notification

**Location**: `backend/src/domain/value-objects/EmailNotification.ts` (NEW)

```typescript
export class EmailNotification {
  constructor(
    public readonly to: string,
    public readonly subject: string,
    public readonly htmlBody: string,
    public readonly textBody: string
  ) {
    this.validateEmail(to);
    this.validateSubject(subject);
    this.validateBody(htmlBody, textBody);
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }
  }

  private validateSubject(subject: string): void {
    if (!subject || subject.trim().length === 0) {
      throw new Error('Email subject cannot be empty');
    }
    if (subject.length > 200) {
      throw new Error('Email subject cannot exceed 200 characters');
    }
  }

  private validateBody(html: string, text: string): void {
    if ((!html || html.trim().length === 0) && (!text || text.trim().length === 0)) {
      throw new Error('Email must have either HTML or text body');
    }
  }
}
```

## Infrastructure Interfaces

### IEmailService

**Location**: `backend/src/infrastructure/external/IEmailService.ts` (NEW)

```typescript
import { EmailNotification } from '../../domain/value-objects/EmailNotification';

export interface IEmailService {
  /**
   * Send an email notification
   * @param notification Email notification to send
   * @returns Promise that resolves to true if sent successfully, false otherwise
   * @throws Never throws - logs errors and returns false on failure per FR-027
   */
  sendEmail(notification: EmailNotification): Promise<boolean>;

  /**
   * Send new user approval request notification to admin
   * @param userEmail Email of the user requesting access
   * @param userName Name of the user requesting access
   * @param requestedAt Timestamp when access was requested
   * @returns Promise that resolves to true if sent successfully, false otherwise
   */
  sendNewUserNotification(
    userEmail: string,
    userName: string,
    requestedAt: Date
  ): Promise<boolean>;
}
```

## Command/Query Models

### ApproveUserCommand

**Location**: `backend/src/application/commands/users/ApproveUserCommand.ts` (NEW)

```typescript
export class ApproveUserCommand {
  constructor(
    public readonly userId: string,        // User to approve
    public readonly adminUserId: string    // Admin performing approval
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    if (!this.adminUserId || this.adminUserId.trim().length === 0) {
      throw new Error('Admin user ID is required');
    }
  }
}
```

### RejectUserCommand

**Location**: `backend/src/application/commands/users/RejectUserCommand.ts` (NEW)

```typescript
export class RejectUserCommand {
  constructor(
    public readonly userId: string,        // User to reject
    public readonly adminUserId: string    // Admin performing rejection
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    if (!this.adminUserId || this.adminUserId.trim().length === 0) {
      throw new Error('Admin user ID is required');
    }
  }
}
```

### GetPendingUsersQuery

**Location**: `backend/src/application/queries/users/GetPendingUsersQuery.ts` (NEW)

```typescript
export class GetPendingUsersQuery {
  constructor(
    public readonly requestingUserId: string  // Admin user requesting the list
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.requestingUserId || this.requestingUserId.trim().length === 0) {
      throw new Error('Requesting user ID is required');
    }
  }
}

export interface PendingUserDTO {
  id: string;
  email: string;
  name: string;
  oauthSubject: string;
  approvalRequestedAt: Date;
}
```

## Data Transfer Objects (DTOs)

### UserDTO (EXTENDED)

**Location**: `backend/src/application/queries/users/UserDTO.ts`

**New Fields**:

```typescript
export interface UserDTO {
  // Existing fields...
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  
  // NEW FIELDS
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalRequestedAt: Date | null;
  approvedAt: Date | null;
}
```

**Note**: `approvedBy` is intentionally excluded from DTO for privacy

## Data Flow

### New User Registration Flow

```
1. User authenticates with Google OAuth
   ↓
2. Google OAuth callback returns user info (email, name, oauth_subject)
   ↓
3. Check if user exists in database (by oauth_subject)
   ↓
4. If NOT exists:
   a. Create new User entity with approval_status='pending'
   b. Set approval_requested_at to current timestamp
   c. Save to database
   d. Send email notification to admin (IEmailService)
      - Log success/failure per FR-027
      - Continue even if email fails
   e. Return user with pending status
   ↓
5. Return user to frontend with approval status
   ↓
6. Frontend shows pending approval message
```

### User Approval Flow

```
1. Admin views pending users list (GetPendingUsersQuery)
   ↓
2. Admin clicks approve on a user
   ↓
3. Frontend sends ApproveUserCommand
   ↓
4. Backend:
   a. Validate admin has admin privileges (is_admin=true)
   b. Load User entity by userId
   c. Call user.approve(adminUserId)
   d. Save updated User entity
   e. Return success
   ↓
5. Frontend refreshes pending users list
   ↓
6. When pending user logs in again, they see entry list
```

## Relationships

```
User (1) ----approves----> (N) User
  |
  | (references self via approved_by)
  |
```

**Self-Referential Relationship**:

- A User can approve/reject other Users
- `approved_by` column references `users.id`
- Admin users (is_admin=true) can perform approvals
- Regular users cannot approve others

## Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| users | approval_status | B-tree | Fast lookup of pending/approved/rejected users |
| users | approval_requested_at | B-tree | Ordering pending users by request time |
| users | approved_by | B-tree | Foreign key index (auto-created) |

**Index Usage Patterns**:

- `WHERE approval_status = 'pending'` → Uses idx_users_approval_status
- `WHERE approval_status = 'pending' ORDER BY approval_requested_at DESC` → Uses both indexes
- `WHERE approved_by = <admin_id>` → Uses idx_users_approved_by (FK index)

## Constraints

| Constraint | Type | Definition |
|------------|------|------------|
| `chk_approval_consistency` | CHECK | Ensures approved_by and approved_at are set together |
| `fk_approved_by` | FOREIGN KEY | approved_by references users(id) |
| `approval_status_enum` | ENUM | Restricts values to 'pending', 'approved', 'rejected' |

## Data Validation Rules

### Domain Layer (User Entity)

- Email format validation (regex)
- Name length (1-100 characters)
- OAuth subject format
- Approval status transitions (only pending → approved/rejected)
- Approved timestamp must be after requested timestamp

### Application Layer (Commands/Queries)

- User ID format (UUID)
- Admin user ID format (UUID)
- Admin privilege verification before approval operations
- User existence verification

### Infrastructure Layer (Repository)

- Database constraints enforcement
- Transaction management for approval operations
- Optimistic locking for concurrent updates

### UI Layer (HTTP Actions)

- Zod schema validation for request bodies
- Authentication token validation
- Admin role verification in middleware

## Migration Strategy

### Forward Migration

1. Create enum type for approval_status
2. Add new columns with defaults
3. Set existing users to 'approved'
4. Create indexes
5. Add constraints

### Backward Compatibility

- Existing users are automatically approved during migration
- All existing user queries continue to work
- New queries for pending users are additive
- No breaking changes to existing APIs

### Rollback Plan

1. Remove constraints
2. Drop indexes
3. Drop new columns
4. Drop enum type

## Performance Considerations

- Indexes on approval_status and approval_requested_at for fast queries
- Pending users list should be small (< 100 users typically)
- No N+1 queries when loading pending users
- Email sending is non-blocking (async)
- Token caching reduces database hits for auth checks

## Security Considerations

- Admin verification before any approval operations
- User cannot approve themselves
- Approved_by field creates audit trail
- Email notifications logged for compliance
- No sensitive data in email notifications
- Approval status checked on every authenticated request

## Summary

This data model extends the existing User entity to support a complete user approval workflow. The changes are additive and maintain backward compatibility with existing code. The approval state machine is explicit with clear transitions, and all operations are auditable through the approved_by and approved_at fields.
