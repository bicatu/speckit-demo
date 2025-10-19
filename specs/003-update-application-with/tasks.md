# Tasks: Home Page Authentication & Admin Management

**Input**: Design documents from `/specs/003-update-application-with/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Important**: Google Sign-In is configured in **Keycloak/WorkOS admin panel**, NOT in application code. No Google OAuth provider implementation needed.

**TypeScript Code Standards**: All code MUST follow constitution standards: single quotes for strings, `crypto.randomUUID()` for UUIDs, early returns preferred, and Zod validation at UI/Infrastructure boundaries using `safeParse()` with proper error handling.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with separate backend and frontend:
- **Backend (DDD)**: `backend/src/domain/`, `backend/src/application/`, `backend/src/infrastructure/`, `backend/src/ui/`, `backend/tests/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Review existing authentication architecture in backend/AUTHENTICATION.md
- [X] T002 [P] Install nodemailer dependency in backend/package.json
- [X] T003 [P] Install @types/nodemailer dev dependency in backend/package.json
- [X] T004 [P] Configure email environment variables in backend/.env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ADMIN_EMAIL)
- [ ] T005 [P] Review Keycloak/WorkOS setup documentation for Google Identity Provider configuration

**Checkpoint**: Environment and dependencies ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core DDD infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Migration

- [X] T006 Create migration file backend/src/infrastructure/persistence/migrations/005_add_user_approval_status.sql
- [X] T007 Add approval_status ENUM type ('pending', 'approved', 'rejected') in migration
- [X] T008 Add approval_status column to users table with default 'approved' in migration
- [X] T009 Add approval_requested_at TIMESTAMP column in migration
- [X] T010 Add approved_by UUID column with foreign key to users table in migration
- [X] T011 Add approved_at TIMESTAMP column in migration
- [X] T012 Create index on approval_status column in migration
- [X] T013 Create index on approval_requested_at column in migration
- [X] T014 Set existing users to 'approved' status in migration (backward compatibility)
- [X] T015 Run migration on development database

### Domain Layer Foundation

- [X] T016 [P] Extend User entity in backend/src/domain/entities/User.ts with approvalStatus field
- [X] T017 [P] Add approvalRequestedAt field to User entity
- [X] T018 [P] Add approvedBy field to User entity
- [X] T019 [P] Add approvedAt field to User entity
- [X] T020 Add isPending() method to User entity
- [X] T021 Add isApproved() method to User entity
- [X] T022 Add isRejected() method to User entity
- [X] T023 Add approve(adminUserId: string) method to User entity with validation
- [X] T024 Add reject(adminUserId: string) method to User entity with validation
- [X] T025 Add requestApproval() method to User entity
- [X] T026 [P] Extend IUserRepository interface in backend/src/domain/repositories/IUserRepository.ts with findPendingUsers() method
- [X] T027 [P] Add findByApprovalStatus(status: string) method to IUserRepository
- [X] T028 [P] Add countPendingUsers() method to IUserRepository

### Infrastructure Layer Foundation

- [X] T029 Create IEmailService interface in backend/src/infrastructure/external/IEmailService.ts
- [X] T030 Implement NodemailerEmailService in backend/src/infrastructure/external/NodemailerEmailService.ts
- [X] T031 [P] Extend PostgresUserRepository in backend/src/infrastructure/domain/PostgresUserRepository.ts with findPendingUsers() implementation
- [X] T032 [P] Implement findByApprovalStatus() in PostgresUserRepository
- [X] T033 [P] Implement countPendingUsers() in PostgresUserRepository
- [X] T034 Update Container in backend/src/config/Container.ts to register IEmailService

### Middleware Foundation

- [X] T035 Extend authMiddleware in backend/src/ui/http/middleware/auth.ts to check approval_status and return 403 for pending users

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Returning User Direct Entry Access (Priority: P1) 🎯 MVP

**Goal**: Authenticated and approved users see the entry list immediately on home page without additional navigation

**Independent Test**: Log in as approved user, visit home page, verify entry list displays immediately

### Frontend Implementation for User Story 1

- [X] T036 [P] [US1] Extend AuthContext in frontend/src/contexts/AuthContext.tsx to include approvalStatus field
- [X] T037 [US1] Update HomePage in frontend/src/pages/HomePage.tsx to check authentication status
- [X] T038 [US1] Add conditional rendering in HomePage: if authenticated and approved → show entry list
- [X] T039 [US1] Add conditional rendering in HomePage: if not authenticated → redirect to LoginPage
- [X] T040 [US1] Add conditional rendering in HomePage: if authenticated but pending → show PendingApprovalMessage

**Checkpoint**: User Story 1 complete - authenticated approved users see entry list on home page

---

## Phase 4: User Story 2 - New User Google Sign-In (Priority: P1)

**Goal**: Unauthenticated users see login page that redirects to Keycloak/WorkOS with Google sign-in option

**Independent Test**: Visit home page without authentication, verify login page appears, click login, verify redirect to Keycloak/WorkOS

### Frontend Implementation for User Story 2

- [X] T041 [P] [US2] Create LoginPage component in frontend/src/pages/LoginPage.tsx
- [X] T042 [US2] Add "Login" button in LoginPage that redirects to /api/auth/login
- [X] T043 [US2] Add route for LoginPage in frontend router configuration
- [X] T044 [US2] Update HomePage to redirect to LoginPage when not authenticated

**Checkpoint**: User Story 2 complete - unauthenticated users can initiate OAuth login flow

---

## Phase 5: User Story 3 - New User Account Request (Priority: P2)

**Goal**: New users authenticating via Google trigger admin email notification and see pending approval message

**Independent Test**: Authenticate with new Google account, verify admin receives email, verify user sees pending message

### Backend Implementation for User Story 3

- [X] T045 [US3] Create ApproveUserCommand in backend/src/application/commands/users/ApproveUserCommand.ts
- [X] T046 [US3] Create ApproveUserCommandHandler in backend/src/application/commands/users/ApproveUserCommandHandler.ts
- [X] T047 [US3] Create RejectUserCommand in backend/src/application/commands/users/RejectUserCommand.ts
- [X] T048 [US3] Create RejectUserCommandHandler in backend/src/application/commands/users/RejectUserCommandHandler.ts
- [X] T049 [US3] Extend callback action in backend/src/ui/http/actions/auth/callback.ts to create new users with 'pending' status
- [X] T050 [US3] Add email notification trigger in callback action using IEmailService
- [X] T051 [US3] Update callback action to call user.requestApproval() for new users
- [X] T052 [US3] Add error logging for email failures without blocking authentication
- [X] T053 [US3] Register ApproveUserCommandHandler in handler registry
- [X] T054 [US3] Register RejectUserCommandHandler in handler registry

### Frontend Implementation for User Story 3

- [X] T055 [P] [US3] Create PendingApprovalMessage component in frontend/src/components/PendingApprovalMessage.tsx
- [X] T056 [US3] Display PendingApprovalMessage when user is authenticated but approval_status is 'pending'
- [X] T057 [US3] Update AuthContext to fetch and store user approval status from /api/auth/me

**Checkpoint**: User Story 3 complete - new users trigger notifications and see pending message

---

## Phase 6: User Story 4 - Admin User Approval Workflow (Priority: P2)

**Goal**: Admins can view pending users list and approve/reject requests

**Independent Test**: Log in as admin, navigate to pending users page, approve a user, verify status change

### Backend Implementation for User Story 4

- [X] T058 [US4] Create GetPendingUsersQuery in backend/src/application/queries/users/GetPendingUsersQuery.ts
- [X] T059 [US4] Create GetPendingUsersQueryHandler in backend/src/application/queries/users/GetPendingUsersQueryHandler.ts
- [X] T060 [US4] Create Zod schema for GetPendingUsersRequest in backend/src/ui/http/actions/users/getPendingUsers.ts
- [X] T061 [US4] Implement getPendingUsers action handler in backend/src/ui/http/actions/users/getPendingUsers.ts
- [X] T062 [US4] Add admin-only middleware check in getPendingUsers action
- [X] T063 [US4] Create Zod schema for ApproveUserRequest in backend/src/ui/http/actions/users/approveUser.ts
- [X] T064 [US4] Implement approveUser action handler in backend/src/ui/http/actions/users/approveUser.ts
- [X] T065 [US4] Add admin-only middleware check in approveUser action
- [X] T066 [US4] Create Zod schema for RejectUserRequest in backend/src/ui/http/actions/users/rejectUser.ts
- [X] T067 [US4] Implement rejectUser action handler in backend/src/ui/http/actions/users/rejectUser.ts
- [X] T068 [US4] Add admin-only middleware check in rejectUser action
- [X] T069 [US4] Register GET /api/users/pending route in backend router
- [X] T070 [US4] Register POST /api/users/:id/approve route in backend router
- [X] T071 [US4] Register POST /api/users/:id/reject route in backend router
- [X] T072 [US4] Register GetPendingUsersQueryHandler in handler registry

### Frontend Implementation for User Story 4

- [X] T073 [P] [US4] Create usePendingUsers hook in frontend/src/hooks/usePendingUsers.ts
- [X] T074 [P] [US4] Create useApproveUser hook in frontend/src/hooks/useApproveUser.ts
- [X] T075 [P] [US4] Create useRejectUser hook in frontend/src/hooks/useRejectUser.ts
- [X] T076 [US4] Create PendingUsersPage component in frontend/src/pages/PendingUsersPage.tsx
- [X] T077 [US4] Display pending users list in PendingUsersPage using usePendingUsers hook
- [X] T078 [US4] Add approve button for each pending user in PendingUsersPage
- [X] T079 [US4] Add reject button for each pending user in PendingUsersPage
- [X] T080 [US4] Implement approve action using useApproveUser hook
- [X] T081 [US4] Implement reject action using useRejectUser hook
- [X] T082 [US4] Add route for PendingUsersPage in frontend router (admin only)
- [X] T083 [US4] Add navigation link to PendingUsersPage in admin menu

**Checkpoint**: User Story 4 complete - admins can manage pending user requests

---

## Phase 7: User Story 5 - Admin Tag and Platform Management (Priority: P2)

**Goal**: Admins can create, view, and delete tags and streaming platforms from dedicated management page

**Independent Test**: Log in as admin, access management page, create/delete tags and platforms

### Frontend Implementation for User Story 5

- [X] T084 [P] [US5] Create useCreateTag hook in frontend/src/hooks/useCreateTag.ts
- [X] T085 [P] [US5] Create useDeleteTag hook in frontend/src/hooks/useDeleteTag.ts
- [X] T086 [P] [US5] Create useCreatePlatform hook in frontend/src/hooks/useCreatePlatform.ts
- [X] T087 [P] [US5] Create useDeletePlatform hook in frontend/src/hooks/useDeletePlatform.ts
- [X] T088 [US5] Create ManageResourcesPage component in frontend/src/pages/ManageResourcesPage.tsx
- [X] T089 [US5] Display tags list in ManageResourcesPage using useTags hook
- [X] T090 [US5] Display platforms list in ManageResourcesPage using usePlatforms hook
- [X] T091 [US5] Add create tag form in ManageResourcesPage
- [X] T092 [US5] Add create platform form in ManageResourcesPage
- [X] T093 [US5] Add delete button for each tag with confirmation dialog
- [X] T094 [US5] Add delete button for each platform with confirmation dialog
- [X] T095 [US5] Implement tag deletion with error handling for tags in use (per FR-025)
- [X] T096 [US5] Implement platform deletion with error handling for platforms in use (per FR-025)
- [X] T097 [US5] Display warning message listing affected entries when deletion prevented
- [X] T098 [US5] Add route for ManageResourcesPage in frontend router (admin only)
- [X] T099 [US5] Create AdminManagementNav component in frontend/src/components/AdminManagementNav.tsx
- [X] T100 [US5] Add "Manage Tags & Platforms" navigation link visible only to admins

**Checkpoint**: User Story 5 complete - admins can manage tags and platforms

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T101 [P] Update main README.md with new approval workflow and documentation links
- [X] T102 [P] Create docs/GOOGLE_OAUTH_SETUP.md with comprehensive Google OAuth setup guide
- [X] T103 [P] Create docs/EMAIL_SETUP.md with email notification configuration guide
- [X] T104 [P] Update backend/AUTHENTICATION.md with approval workflow and session management
- [X] T105 [P] Update KEYCLOAK_SETUP.md with Google Identity Provider configuration section
- [X] T106 [P] Document session refresh logic requirements (FR-026) in AUTHENTICATION.md
- [X] T107 [P] Verify email service error handling is non-blocking (already implemented)
- [X] T108 [P] Verify all Zod schemas use safeParse() with proper error handling (code review)
- [X] T109 [P] Verify all string literals use single quotes per TypeScript standards (code review)
- [ ] T110 Run backend tests: npm test in backend directory
- [ ] T111 Run frontend tests: npm test in frontend directory
- [ ] T112 Run quickstart.md validation steps
- [ ] T113 Manual end-to-end testing of complete user approval workflow

**Note**: Documentation tasks completed. Testing tasks (T110-T113) require manual execution.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational phase - Frontend changes only
- **User Story 2 (Phase 4)**: Depends on Foundational phase - Frontend changes only
- **User Story 3 (Phase 5)**: Depends on Foundational phase - Backend + Frontend changes
- **User Story 4 (Phase 6)**: Depends on Foundational phase - Backend + Frontend changes
- **User Story 5 (Phase 7)**: Depends on Foundational phase - Frontend changes only (reuses existing backend endpoints)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent but logically follows US1/US2
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent but completes US3 workflow
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Independent admin feature

### Critical Path

1. Setup (T001-T005) → ~30 minutes
2. Foundational (T006-T035) → **BLOCKING** ~4-6 hours (database + DDD layers)
3. Then all user stories can proceed in parallel or by priority:
   - US1 + US2 (P1 stories) → ~2-3 hours each (includes test execution)
   - US3 (P2 story with TDD) → ~5-7 hours (includes TDD test writing + test execution)
   - US4 (P2 story with TDD + integration tests) → ~8-12 hours (includes TDD + integration tests + test execution)
   - US5 (P2 story) → ~4-6 hours (includes test execution)

### Parallel Opportunities

**Setup Phase (all parallel)**:
- T002, T003, T004, T005 can all run simultaneously

**Foundational Phase (some parallel)**:
- Migration tasks (T006-T015) must be sequential
- Domain layer tasks (T016-T025) can run in parallel after migration
- IRepository extensions (T026-T028) can run in parallel
- Infrastructure implementations (T029-T034) can run after interfaces complete

**After Foundational completes, ALL user stories can run in parallel** if team capacity allows:
- Developer A: User Story 1 (T036-T040)
- Developer B: User Story 2 (T041-T044)
- Developer C: User Story 3 (T045-T057)
- Developer D: User Story 4 (T058-T083)
- Developer E: User Story 5 (T084-T100)

**Within User Stories**:
- US1: All frontend tasks (T036-T040) sequential due to same files
- US2: All frontend tasks (T041-T044) sequential
- US3: Backend tasks (T045-T054) mostly sequential, Frontend tasks (T055-T057) where T055 is parallel
- US4: Backend queries (T058-T059) parallel with backend commands, Frontend hooks (T073-T075) parallel
- US5: All frontend hooks (T084-T087) can run in parallel

---

## Parallel Example: After Foundational Phase

```bash
# If you have 5 developers, launch all user stories simultaneously:

Developer 1 (Frontend specialist):
  "Extend AuthContext with approvalStatus field" (T036)
  → "Update HomePage authentication check" (T037-T040)
  
Developer 2 (Frontend specialist):
  "Create LoginPage component" (T041)
  → "Add login route" (T043-T044)

Developer 3 (Full-stack):
  "Write ApproveUserCommand test" (T045)
  → "Create ApproveUserCommand" (T046-T047)
  → "Extend auth callback" (T051-T054)
  → "Create PendingApprovalMessage" (T057-T059)
  → "Run US3 tests" (T059a)

Developer 4 (Full-stack):
  "Write GetPendingUsersQuery test" (T060)
  → "Create GetPendingUsersQuery" (T061-T062)
  → "Implement pending users endpoints" (T063-T075)
  → "Add integration tests" (T076-T078)
  → "Create PendingUsersPage" (T079-T089)
  → "Run US4 tests" (T089a)

Developer 5 (Frontend specialist):
  "Create tag/platform hooks" (T090-T093)
  → "Create ManageResourcesPage" (T094-T106)
  → "Run US5 tests" (T106a)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (~30 min)
2. Complete Phase 2: Foundational (~4-6 hours) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (~2-3 hours) including test execution (T040a)
4. Complete Phase 4: User Story 2 (~2-3 hours) including test execution (T044a)
5. **STOP and VALIDATE**: 
   - Test authenticated users see entry list
   - Test unauthenticated users see login page
   - Test OAuth flow through Keycloak/WorkOS
6. **MVP READY**: Basic authentication and home page routing working

### Incremental Delivery

1. **Foundation**: Setup + Foundational → Database ready, DDD layers ready (~5-7 hours)
2. **MVP Release (P1 Stories)**: Add US1 + US2 → Test after each story (T040a, T044a) → Deploy/Demo (~5-6 hours)
   - Value: Authenticated users access entries, new users can log in
3. **Access Control Release (P2 Stories)**: Add US3 + US4 with TDD → Test after each story (T059a, T089a) → Deploy/Demo (~13-19 hours)
   - Value: Admin approval workflow, email notifications, pending user management
4. **Admin Tools Release (P2 Story)**: Add US5 → Test after story (T106a) → Deploy/Demo (~4-6 hours)
   - Value: Self-service tag and platform management
5. **Polish**: Add Phase 8 improvements including session refresh → Final validation (~2-3 hours)

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

**Sprint 1 (P1 Stories - MVP)**:
- Developer A: User Story 1 (frontend)
- Developer B: User Story 2 (frontend)
- Both can work in parallel, different files

**Sprint 2 (P2 Stories - Access Control)**:
- Developer A: User Story 3 (backend + frontend)
- Developer B: User Story 4 (backend + frontend)
- Developer C: User Story 5 (frontend only)
- All can work in parallel, minimal overlap

---

## Task Summary

- **Total Tasks**: 115 (was 112, added 3 TDD test tasks + 3 integration test tasks + 5 test execution tasks - 2 removed from Polish phase = +9 net)
- **Setup Phase**: 5 tasks
- **Foundational Phase**: 30 tasks (BLOCKING)
- **User Story 1** (P1): 5 tasks (frontend) + 1 test execution = 6 tasks
- **User Story 2** (P1): 4 tasks (frontend) + 1 test execution = 5 tasks
- **User Story 3** (P2): 12 tasks (backend + frontend) + 3 TDD test tasks + 1 test execution = 16 tasks
- **User Story 4** (P2): 26 tasks (backend + frontend) + 3 TDD test tasks + 3 integration test tasks + 1 test execution = 33 tasks
- **User Story 5** (P2): 17 tasks (frontend) + 1 test execution = 18 tasks
- **Polish Phase**: 9 tasks (removed test execution, added session refresh)

**Parallel Tasks**: 31 tasks marked [P] can run in parallel with others

**MVP Scope** (Recommended): Setup + Foundational + US1 + US2 = 46 tasks (~11-14 hours)

**Full Feature**: All 115 tasks (~27-38 hours depending on parallelization)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- **TDD tasks**: Unit tests written BEFORE implementation for Command/Query handlers (Red-Green-Refactor cycle)
- **Test execution**: Run tests after each user story completion (T040a, T044a, T059a, T089a, T106a)
- Each user story should be independently completable and testable
- **NO Google OAuth provider implementation needed** - configured externally in Keycloak/WorkOS
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backend-first approach: Database → Domain → Application (with TDD) → Infrastructure → UI
- Frontend integrates with working backend endpoints
