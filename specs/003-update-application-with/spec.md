# Feature Specification: Home Page Authentication & Admin Management

**Feature Branch**: `003-update-application-with`  
**Created**: October 19, 2025  
**Status**: Draft  
**Input**: User description: "Update application. 1) When the user visits the home page of the application there should be a check if the user is logged in or not. If he is logged in, show directly the list of entries (like today when I click on Browse) If he is not logged in, show a page for him to login and add the login with Google option. The login with google will work as expected for an SSO. If the user does not exist yet, email the admin user so he can approve the request. 2) Add an option to the menu to leave to a page where the user (if admin) can manage the tags and the streaming platforms"

## Clarifications

### Session 2025-10-19

- Q: How should admins approve new user access requests? → A: Admin logs into application and approves from a pending users list/page
- Q: What should happen when an admin tries to delete a tag or platform that is currently used by existing entries? → A: Prevent deletion and show warning message listing affected entries
- Q: What should happen when a user's session expires while they are actively using the application? → A: Silently refresh session in background
- Q: What should happen if the admin notification email fails to send when a new user attempts to authenticate? → A: Log the error and allow authentication to proceed (admin checks pending list)
- Q: How should the system identify which users have admin privileges? → A: Database field/attribute on user record (e.g., isAdmin or role field)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Returning User Direct Entry Access (Priority: P1)

When an authenticated user visits the home page, they are immediately shown the list of entries without requiring additional navigation or login steps.

**Why this priority**: This is the most frequently used path for existing users. Reducing friction for authenticated users directly impacts daily usage satisfaction and efficiency.

**Independent Test**: Can be fully tested by logging in once, navigating to home page, and verifying entry list displays immediately. Delivers immediate value by streamlining the primary user workflow.

**Acceptance Scenarios**:

1. **Given** a user is already logged in, **When** they visit the home page URL, **Then** the entry list displays immediately without showing login page
2. **Given** a user is logged in and browsing other pages, **When** they click the home/logo link, **Then** they see the entry list without authentication prompts
3. **Given** a user has an active session, **When** they return to the application within the session timeout period, **Then** they see the entry list immediately

---

### User Story 2 - New User Google Sign-In (Priority: P1)

When an unauthenticated user visits the home page, they see a login page with a Google sign-in option that handles the complete SSO authentication flow.

**Why this priority**: This is the gateway for new users and the primary authentication method. Without this, no users can access the system.

**Independent Test**: Can be fully tested by visiting the home page without authentication, clicking "Sign in with Google", completing Google OAuth flow, and verifying successful authentication. Delivers value by enabling user access.

**Acceptance Scenarios**:

1. **Given** a user is not logged in, **When** they visit the home page, **Then** they see a login page with a "Sign in with Google" button
2. **Given** a user clicks "Sign in with Google", **When** they complete Google authentication, **Then** they are redirected back to the application
3. **Given** a user successfully authenticates with Google and is an existing approved user, **When** the authentication completes, **Then** they see the entry list
4. **Given** a user completes Google authentication, **When** they close the browser and return later, **Then** they remain authenticated based on session configuration

---

### User Story 3 - New User Account Request (Priority: P2)

When a user authenticates with Google but does not have an approved account, the system notifies administrators and shows the user a pending approval message.

**Why this priority**: This controls system access and ensures only approved users can use the application. Critical for security but lower priority than basic authentication since it only affects new users.

**Independent Test**: Can be fully tested by authenticating with a new Google account not in the system, verifying admin receives notification email, and checking that user sees appropriate message. Delivers value by managing access control.

**Acceptance Scenarios**:

1. **Given** a user authenticates with Google using an email not in the system, **When** authentication completes, **Then** an email is sent to the admin user with account approval request details
2. **Given** a new user completes Google authentication, **When** they are not yet approved, **Then** they see a message stating "Your account request has been submitted and is pending admin approval"
3. **Given** a new user request is submitted, **When** they try to access the application before approval, **Then** they continue to see the pending approval message
4. **Given** an admin receives the approval email, **When** they review it, **Then** it includes the user's Google email, name, and timestamp of the request

---

### User Story 4 - Admin User Approval Workflow (Priority: P2)

Admin users can view a list of pending user access requests within the application and approve or reject them.

**Why this priority**: This completes the access control flow and enables admins to manage user access securely. Essential for security but lower priority than the initial request notification.

**Independent Test**: Can be fully tested by submitting a new user request, logging in as admin, viewing pending users list, and approving the request. Delivers value by enabling controlled user access management.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they navigate to the user management area, **Then** they see a list of all pending user access requests
2. **Given** an admin views the pending users list, **When** reviewing each request, **Then** they see the user's email, name, and request timestamp
3. **Given** an admin selects a pending user, **When** they click approve, **Then** the user's status changes to approved and they can access the application
4. **Given** an admin approves a user, **When** the approved user logs in again, **Then** they see the entry list instead of the pending approval message
5. **Given** an admin selects a pending user, **When** they click reject, **Then** the user's access request is denied

---

### User Story 5 - Admin Tag and Platform Management (Priority: P2)

Admin users can access a dedicated management page from the menu to create, edit, and delete tags and streaming platforms.

**Why this priority**: This enables content organization and categorization without requiring technical intervention. Important for ongoing system maintenance but not critical for initial user access.

**Independent Test**: Can be fully tested by logging in as admin, accessing the management menu option, and performing CRUD operations on tags and platforms. Delivers value by enabling self-service content management.

**Acceptance Scenarios**:

1. **Given** a user is logged in as admin, **When** they view the application menu, **Then** they see a "Manage Tags & Platforms" option
2. **Given** a non-admin user is logged in, **When** they view the application menu, **Then** they do not see the "Manage Tags & Platforms" option
3. **Given** an admin clicks "Manage Tags & Platforms", **When** the page loads, **Then** they see lists of existing tags and streaming platforms
4. **Given** an admin is on the management page, **When** they create a new tag, **Then** it appears in the tag list immediately
5. **Given** an admin is on the management page, **When** they create a new streaming platform, **Then** it appears in the platform list immediately
6. **Given** an admin is on the management page, **When** they delete a tag, **Then** it is removed from the system
7. **Given** an admin is on the management page, **When** they delete a streaming platform, **Then** it is removed from the system
8. **Given** an admin edits a tag or platform, **When** they save changes, **Then** the updated information is reflected throughout the application

---

### Edge Cases

- How does the system handle Google authentication failures (user rejects permission, network error)?
- What happens when multiple admins need to be notified of account requests?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST check authentication status when a user visits the home page
- **FR-002**: System MUST display the entry list directly to authenticated users visiting the home page
- **FR-003**: System MUST display a login page to unauthenticated users visiting the home page (this is a redirect component that immediately redirects to /api/auth/login, not a login form)
- **FR-004**: Login page MUST include a "Sign in with Google" authentication option
- **FR-005**: System MUST implement Google SSO authentication following OpenID Connect standards (OAuth 2.0 + identity layer)
- **FR-006**: System MUST attempt to send an email notification to the admin user when a new user authenticates with Google but does not exist in the system; on email failure, the system MUST log the error and allow authentication to proceed so admins can review pending users through the pending users list
- **FR-007**: Email notification MUST include the new user's email address, full name (if available from Google), and timestamp of the request
- **FR-008**: System MUST display a pending approval message to new users who have authenticated but are not yet approved
- **FR-009**: System MUST prevent unapproved users from accessing the entry list or other protected features
- **FR-010**: System MUST add a "Manage Tags & Platforms" option to the navigation menu visible only to admin users
- **FR-011**: System MUST provide a management interface where admins can view all existing tags
- **FR-012**: System MUST allow admins to create new tags through the management interface
- **FR-013**: System MUST allow admins to delete existing tags through the management interface
- **FR-014**: System MUST provide a management interface where admins can view all existing streaming platforms
- **FR-015**: System MUST allow admins to create new streaming platforms through the management interface
- **FR-016**: System MUST allow admins to delete existing streaming platforms through the management interface
- **FR-017**: System MUST restrict access to the management page to users with admin role only
- **FR-018**: System MUST maintain user session state across page navigation
- **FR-019**: System MUST handle Google authentication errors gracefully with user-friendly error messages that avoid technical jargon, suggest next steps, and include support contact information for persistent issues
- **FR-020**: System MUST redirect users to the entry list after successful Google authentication (for approved users)
- **FR-021**: System MUST provide a pending users list interface accessible only to admin users
- **FR-022**: System MUST allow admins to approve pending user access requests
- **FR-023**: System MUST allow admins to reject pending user access requests
- **FR-024**: System MUST update user approval status when an admin approves or rejects a request
- **FR-025**: System MUST prevent deletion of tags or platforms that are associated with existing entries and display a warning message showing the count of affected entries and listing entry titles (maximum 10 titles, then '...and N more' if additional entries exist)
- **FR-026**: System MUST attempt to silently refresh user sessions in the background when they approach expiration
- **FR-027**: System MUST identify admin users through a database field (e.g., is_admin flag or role attribute) on the user record

### Key Entities

- **User**: Represents an application user with authentication status (authenticated/unauthenticated), approval status (pending/approved), role (admin/regular user), and Google account information (email, name)
- **Admin Notification**: Represents a notification sent to administrators containing new user request information
- **Tag**: Represents a categorization label with a name/identifier, associated with entries
- **Streaming Platform**: Represents a content delivery service with a name/identifier, associated with entries
- **Session**: Represents an authenticated user's active session with timeout and state information

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users see the entry list within 2 seconds of visiting the home page without additional clicks (on broadband connection with 10+ Mbps and <50ms latency to server)
- **SC-002**: Unauthenticated users can complete the Google sign-in flow in under 30 seconds
- **SC-003**: Admin receives email notification within 1 minute of a new user's first authentication attempt
- **SC-004**: 100% of new user requests include complete information (email, name, timestamp) in the admin notification
- **SC-005**: Admin users can create a new tag or platform in under 10 seconds
- **SC-006**: Non-admin users cannot access the management page through any navigation path
- **SC-007**: 95% of authentication attempts complete successfully without errors
- **SC-008**: User sessions persist for the duration of active use without unexpected logouts
- **SC-009**: Zero instances of unapproved users accessing protected features
- **SC-010**: Admin management operations (create, delete) take effect immediately and are visible within 3 seconds (on broadband connection with 10+ Mbps and <50ms latency to server)

## Assumptions

- The application already has an authentication system that can be extended to support Google SSO
- The application has a defined concept of "admin user" with a database field (e.g., is_admin) for role identification
- An email service is configured and available for sending admin notifications
- The existing entry list functionality can be reused on the home page
- Users are comfortable with Google as an authentication provider
- Admin email address is configured in the system settings
- Session timeout policies are already defined in the application
- The application runs over HTTPS to support secure OAuth flows
- Google OAuth credentials are configured for the application
- The system maintains a user database where approval status can be stored
