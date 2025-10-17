---
description: "Task list for Multi-User Movie & Series Tracking Application implementation"
---

# Tasks: Multi-User Movie & Series Tracking Application

**Input**: Design documents from `/specs/001-multi-user-movie/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Test tasks are included following TDD principles as specified in the Constitution. All tests must be written FIRST and must FAIL before implementation begins.

**TypeScript Code Standards**: All code MUST follow constitution standards: single quotes for strings, `crypto.randomUUID()` for UUIDs, early returns preferred, and Zod validation at UI/Infrastructure boundaries using `safeParse()` with proper error handling.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with backend (DDD layers) and frontend (React SPA):
- **Backend**: `backend/src/domain/`, `backend/src/application/`, `backend/src/infrastructure/`, `backend/src/ui/`, `backend/tests/`
- **Frontend**: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend project structure (src/domain/, src/application/, src/infrastructure/, src/ui/, tests/)
- [X] T002 Create frontend project structure (src/components/, src/pages/, src/services/, src/hooks/, tests/)
- [X] T003 Initialize backend package.json with TypeScript 5.7.2, Koa 2.16.1, Zod 3.22.4, WorkOS Node SDK 7.0.0, pg 8.11.3
- [X] T004 [P] Initialize frontend package.json with React 18.2.0, TypeScript 5.7.2, TanStack Query 5.17.0, Vite
- [X] T005 [P] Configure backend tsconfig.json for Node.js 22.x LTS
- [X] T006 [P] Configure frontend tsconfig.json and vite.config.ts
- [X] T007 [P] Setup Jest 29.7.0 with ts-jest 29.1.1, ts-jest-mocker 1.1.0 for backend testing
- [X] T008 [P] Setup React Testing Library 14.1.2 for frontend testing
- [X] T009 [P] Configure ESLint and Prettier for TypeScript
- [X] T010 Create docker-compose.yml at repository root with PostgreSQL 16 service (exposed port 5432, health checks, volume mappings) and OAuth mock service for local development (per Constitution IX)
- [X] T011 [P] Create .env.example files for backend and frontend
- [X] T012 [P] Create README.md with quickstart instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core DDD infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [X] T013 Create database connection pool in backend/src/infrastructure/persistence/DatabaseConnection.ts
- [X] T014 Create database migration 001_initial_schema.sql in backend/src/infrastructure/persistence/migrations/ (includes all tables, constraints, and indexes per data-model.md)
- [X] T015 Create database migration 002_seed_data.sql for dev data in backend/src/infrastructure/persistence/migrations/
- [X] T016 [P] Create base Command interface in backend/src/application/commands/Command.ts
- [X] T017 [P] Create base Query interface in backend/src/application/queries/Query.ts
- [X] T018 [P] Create base CommandHandler interface in backend/src/application/commands/CommandHandler.ts
- [X] T019 [P] Create base QueryHandler interface in backend/src/application/queries/QueryHandler.ts
- [X] T020 Setup Koa server with createServer() function in backend/src/ui/http/server.ts
- [X] T021 Create WorkOS OAuth2 client in backend/src/infrastructure/external/WorkOSClient.ts
- [X] T022 Create authentication middleware in backend/src/ui/http/middleware/auth.ts
- [X] T023 [P] Setup error response formatting utility in backend/src/ui/http/utils/errors.ts
- [X] T024 [P] Create handler registry and dispatcher pattern in backend/src/ui/http/utils/HandlerRegistry.ts

### Frontend Foundation

- [X] T025 [P] Create Axios API client configuration in frontend/src/services/api.ts
- [X] T026 [P] Setup TanStack Query provider in frontend/src/App.tsx
- [X] T027 [P] Create authentication context/hook in frontend/src/App.tsx (React Router + QueryClientProvider)
- [X] T028 [P] Create base React foundation in frontend/src/main.tsx + frontend/index.html

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse and Discover Content (Priority: P1) 🎯 MVP

**Goal**: Users can browse existing movies/series entries, filter by tags, view detailed information, and see community ratings

**Independent Test**: Load the application and browse the list of entries, filter by tags, and view detailed information about individual movies/series

### Tests for User Story 1 (TDD - Write FIRST, ensure they FAIL)

#### Backend Tests

- [X] T029 [P] [US1] Unit test for Entry entity in backend/tests/unit/domain/entities/Entry.spec.ts
- [X] T030 [P] [US1] Unit test for GenreTag entity in backend/tests/unit/domain/entities/GenreTag.spec.ts
- [ ] T031 [P] [US1] Unit test for EntryFilters value object in backend/tests/unit/domain/value-objects/EntryFilters.spec.ts
- [ ] T032 [P] [US1] Unit test for GetEntriesQueryHandler in backend/tests/unit/application/queries/GetEntriesQueryHandler.spec.ts
- [ ] T033 [P] [US1] Unit test for GetEntryDetailsQueryHandler in backend/tests/unit/application/queries/GetEntryDetailsQueryHandler.spec.ts
- [ ] T034 [P] [US1] Integration test for PostgresEntryRepository in backend/tests/integration/infrastructure/domain/PostgresEntryRepository.spec.ts
- [ ] T035 [P] [US1] Integration test for GetEntriesQuery flow in backend/tests/integration/application/queries/GetEntriesQuery.spec.ts
- [ ] T036 [P] [US1] Contract test for GET /entries endpoint in backend/tests/contract/endpoints/getEntries.spec.ts
- [ ] T037 [P] [US1] Contract test for GET /entries/:entryId endpoint in backend/tests/contract/endpoints/getEntryDetails.spec.ts

#### Frontend Tests

- [ ] T038 [P] [US1] Unit test for EntryList component in frontend/tests/unit/components/EntryList.spec.tsx
- [ ] T039 [P] [US1] Unit test for EntryCard component in frontend/tests/unit/components/EntryCard.spec.tsx
- [ ] T040 [P] [US1] Unit test for FilterBar component in frontend/tests/unit/components/FilterBar.spec.tsx
- [ ] T041 [P] [US1] Unit test for Pagination component in frontend/tests/unit/components/Pagination.spec.tsx
- [ ] T042 [P] [US1] Integration test for HomePage in frontend/tests/integration/pages/HomePage.spec.tsx
- [ ] T043 [P] [US1] Integration test for EntryDetailsPage in frontend/tests/integration/pages/EntryDetailsPage.spec.tsx

### Domain Layer Implementation for User Story 1

- [X] T044 [P] [US1] Create User entity in backend/src/domain/entities/User.ts
- [X] T045 [P] [US1] Create Entry entity with title, media_type ('film' or 'series'), and timestamps in backend/src/domain/entities/Entry.ts
- [ ] T045a [US1] Add title uniqueness validation method to Entry entity or create EntryFactory in backend/src/domain/entities/ to enforce FR-003 title uniqueness at domain layer
- [X] T046 [P] [US1] Create GenreTag entity in backend/src/domain/entities/GenreTag.ts
- [X] T047 [P] [US1] Create StreamingPlatform entity in backend/src/domain/entities/StreamingPlatform.ts
- [X] T048 [P] [US1] Create Rating entity in backend/src/domain/entities/Rating.ts
- [ ] T049 [P] [US1] Create EntryFilters value object in backend/src/domain/value-objects/EntryFilters.ts
- [X] T050 [P] [US1] Create IUserRepository interface in backend/src/domain/repositories/IUserRepository.ts
- [X] T051 [P] [US1] Create IEntryRepository interface in backend/src/domain/repositories/IEntryRepository.ts
- [X] T052 [P] [US1] Create IGenreTagRepository interface in backend/src/domain/repositories/IGenreTagRepository.ts
- [X] T053 [P] [US1] Create IRatingRepository interface in backend/src/domain/repositories/IRatingRepository.ts
- [X] T053a [P] [US1] Create IStreamingPlatformRepository interface in backend/src/domain/repositories/IStreamingPlatformRepository.ts

### Application Layer Implementation for User Story 1

- [X] T054 [US1] Create GetEntriesQuery in backend/src/application/queries/GetEntriesQuery.ts
- [X] T055 [US1] Create GetEntriesQueryHandler in backend/src/application/queries/GetEntriesQueryHandler.ts (depends on T051)
- [X] T056 [US1] Create GetEntryDetailsQuery in backend/src/application/queries/GetEntryDetailsQuery.ts
- [X] T057 [US1] Create GetEntryDetailsQueryHandler in backend/src/application/queries/GetEntryDetailsQueryHandler.ts (depends on T051, T053)
- [X] T058 [US1] Create GetGenreTagsQuery in backend/src/application/queries/tags/GetGenreTagsQuery.ts
- [X] T059 [US1] Create GetGenreTagsQueryHandler in backend/src/application/queries/tags/GetGenreTagsQueryHandler.ts (depends on T052)

### Infrastructure Layer Implementation for User Story 1

- [X] T060 [US1] Implement PostgresUserRepository in backend/src/infrastructure/domain/PostgresUserRepository.ts (depends on T050)
- [X] T061 [US1] Implement PostgresEntryRepository in backend/src/infrastructure/domain/PostgresEntryRepository.ts (depends on T051)
- [X] T062 [US1] Implement PostgresGenreTagRepository in backend/src/infrastructure/domain/PostgresGenreTagRepository.ts (depends on T052)
- [X] T063 [US1] Implement PostgresRatingRepository in backend/src/infrastructure/domain/PostgresRatingRepository.ts (depends on T053)
- [X] T063a [US1] Implement PostgresStreamingPlatformRepository in backend/src/infrastructure/domain/PostgresStreamingPlatformRepository.ts (depends on T053a)
- [X] T064 [US1] Register repositories in dependency injection container

### UI Layer Implementation for User Story 1 (Backend)

- [X] T065 [US1] Create Zod schema for GetEntriesRequest in backend/src/ui/http/actions/entries/getEntries.ts
- [X] T066 [US1] Implement getEntries action handler in backend/src/ui/http/actions/entries/getEntries.ts (validate query params → map to GetEntriesQuery → call handler → return paginated response)
- [X] T067 [US1] Create Zod schema for GetEntryDetailsRequest in backend/src/ui/http/actions/entries/getEntryDetails.ts
- [X] T068 [US1] Implement getEntryDetails action handler in backend/src/ui/http/actions/entries/getEntryDetails.ts (validate params → map to GetEntryDetailsQuery → call handler → return entry with ratings)
- [X] T069 [US1] Implement listTags action handler in backend/src/ui/http/actions/tags/listTags.ts
- [X] T069a [US1] Implement listPlatforms action handler in backend/src/ui/http/actions/platforms/listPlatforms.ts
- [X] T070 [US1] Register GET /api/v1/entries route in backend/src/ui/http/server.ts
- [X] T071 [US1] Register GET /api/v1/entries/:entryId route in backend/src/ui/http/server.ts
- [X] T072 [US1] Register GET /api/v1/tags route in backend/src/ui/http/server.ts
- [X] T072a [US1] Register GET /api/v1/platforms route in backend/src/ui/http/server.ts

### UI Layer Implementation for User Story 1 (Frontend)

- [x] T073 [P] [US1] Create EntryCard component in frontend/src/components/EntryCard.tsx
- [x] T074 [P] [US1] Create EntryList component in frontend/src/components/EntryList.tsx
- [x] T075 [P] [US1] Create FilterBar component in frontend/src/components/FilterBar.tsx
- [x] T076 [P] [US1] Create Pagination component in frontend/src/components/Pagination.tsx
- [x] T077 [P] [US1] Create EntryDetailsComponent in frontend/src/components/EntryDetailsComponent.tsx
- [x] T078 [US1] Create useEntries hook with TanStack Query in frontend/src/hooks/useEntries.ts
- [x] T079 [P] [US1] Create useEntryDetails hook in frontend/src/hooks/useEntryDetails.ts
- [x] T080 [US1] Create useTags hook in frontend/src/hooks/useTags.ts
- [x] T080a [US1] Create usePlatforms hook in frontend/src/hooks/usePlatforms.ts
- [x] T081 [US1] Implement HomePage as BrowseEntriesPage in frontend/src/pages/BrowseEntriesPage.tsx (integrates EntryList, FilterBar, Pagination)
- [x] T082 [US1] Implement EntryDetailsPage integrated in BrowseEntriesPage with useParams
- [x] T083 [US1] Setup React Router with routes (handles /entries and /entries/:id in BrowseEntriesPage)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can browse entries, filter by tags, paginate results, and view entry details with ratings.

---

## Phase 4: User Story 2 - Add Personal Ratings (Priority: P2)

**Goal**: Users can add and update personal ratings (1-10 whole number stars) for existing entries

**Independent Test**: View an existing entry and add/update a personal rating, then verify the rating appears in the entry details and affects the average rating

### Tests for User Story 2 (TDD - Write FIRST, ensure they FAIL)

#### Backend Tests

- [ ] T084 [P] [US2] Unit test for AddRatingCommand in backend/tests/unit/application/commands/AddRatingCommand.spec.ts
- [ ] T085 [P] [US2] Unit test for AddRatingCommandHandler in backend/tests/unit/application/commands/AddRatingCommandHandler.spec.ts
- [ ] T086 [P] [US2] Unit test for UpdateRatingCommand in backend/tests/unit/application/commands/UpdateRatingCommand.spec.ts
- [ ] T087 [P] [US2] Unit test for UpdateRatingCommandHandler in backend/tests/unit/application/commands/UpdateRatingCommandHandler.spec.ts
- [ ] T088 [P] [US2] Integration test for AddRatingCommand flow in backend/tests/integration/application/commands/AddRatingCommand.spec.ts
- [ ] T089 [P] [US2] Contract test for POST /entries/:entryId/ratings endpoint in backend/tests/contract/endpoints/addRating.spec.ts

#### Frontend Tests

- [ ] T090 [P] [US2] Unit test for RatingInput component in frontend/tests/unit/components/RatingInput.spec.tsx
- [ ] T091 [P] [US2] Integration test for adding rating in EntryDetailsPage in frontend/tests/integration/pages/EntryDetailsPage.spec.tsx

### Application Layer Implementation for User Story 2

- [ ] T092 [US2] Create AddRatingCommand in backend/src/application/commands/AddRatingCommand.ts
- [ ] T093 [US2] Create AddRatingCommandHandler in backend/src/application/commands/AddRatingCommandHandler.ts (depends on T053) - MUST update Entry.average_rating cache after adding rating
- [ ] T094 [US2] Create UpdateRatingCommand in backend/src/application/commands/UpdateRatingCommand.ts
- [ ] T095 [US2] Create UpdateRatingCommandHandler in backend/src/application/commands/UpdateRatingCommandHandler.ts (depends on T053) - MUST update Entry.average_rating cache after updating rating

### UI Layer Implementation for User Story 2 (Backend)

- [ ] T096 [US2] Create Zod schema for RatingRequest in backend/src/ui/http/actions/ratings/addRating.ts
- [ ] T097 [US2] Implement addRating action handler in backend/src/ui/http/actions/ratings/addRating.ts (validate body → check if user has existing rating for entry → map to AddRatingCommand (new) or UpdateRatingCommand (existing) → call handler → return 201/200)
- [ ] T098 [US2] Register POST /api/v1/entries/:entryId/ratings route in backend/src/ui/http/server.ts

### UI Layer Implementation for User Story 2 (Frontend)

- [ ] T099 [P] [US2] Create RatingInput component in frontend/src/components/RatingInput.tsx
- [ ] T100 [US2] Create useAddRating hook with TanStack Query mutation in frontend/src/hooks/useAddRating.ts
- [ ] T101 [US2] Integrate RatingInput into EntryDetailsPage in frontend/src/pages/EntryDetailsPage.tsx
- [ ] T102 [US2] Add optimistic updates and cache invalidation for ratings in frontend/src/hooks/useAddRating.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can browse content (US1) and add/update ratings (US2).

---

## Phase 5: User Story 3 - Add New Content (Priority: P3)

**Goal**: Users can add new movies and series entries with title, genre tags (1-3), optional streaming platform, and optional personal rating

**Independent Test**: Add a new movie/series entry with required information and verify it appears in the main list and can be rated

### Tests for User Story 3 (TDD - Write FIRST, ensure they FAIL)

#### Backend Tests

- [ ] T103 [P] [US3] Unit test for CreateEntryCommand in backend/tests/unit/application/commands/CreateEntryCommand.spec.ts
- [ ] T104 [P] [US3] Unit test for CreateEntryCommandHandler in backend/tests/unit/application/commands/CreateEntryCommandHandler.spec.ts
- [ ] T105 [P] [US3] Integration test for CreateEntryCommand flow in backend/tests/integration/application/commands/CreateEntryCommand.spec.ts
- [ ] T106 [P] [US3] Contract test for POST /entries endpoint in backend/tests/contract/endpoints/createEntry.spec.ts
- [ ] T107 [P] [US3] Unit test for GetStreamingPlatformsQueryHandler in backend/tests/unit/application/queries/GetStreamingPlatformsQueryHandler.spec.ts

#### Frontend Tests

- [ ] T108 [P] [US3] Unit test for AddEntryPage in frontend/tests/unit/pages/AddEntryPage.spec.tsx
- [ ] T109 [P] [US3] Integration test for add entry flow in frontend/tests/integration/pages/AddEntryPage.spec.tsx

### Domain Layer Implementation for User Story 3

- [ ] T110 [P] [US3] Create IStreamingPlatformRepository interface in backend/src/domain/repositories/IStreamingPlatformRepository.ts

### Application Layer Implementation for User Story 3

- [ ] T111 [US3] Create CreateEntryCommand in backend/src/application/commands/CreateEntryCommand.ts
- [ ] T112 [US3] Create CreateEntryCommandHandler in backend/src/application/commands/CreateEntryCommandHandler.ts (depends on T045a, T051, T052, T053) - MUST check title uniqueness via IEntryRepository before creating entry (FR-003)
- [ ] T113 [US3] Create GetStreamingPlatformsQuery in backend/src/application/queries/GetStreamingPlatformsQuery.ts
- [ ] T114 [US3] Create GetStreamingPlatformsQueryHandler in backend/src/application/queries/GetStreamingPlatformsQueryHandler.ts (depends on T110)

### Infrastructure Layer Implementation for User Story 3

- [ ] T115 [US3] Implement PostgresStreamingPlatformRepository in backend/src/infrastructure/domain/PostgresStreamingPlatformRepository.ts (depends on T110)
- [ ] T116 [US3] Register StreamingPlatformRepository in dependency injection container

### UI Layer Implementation for User Story 3 (Backend)

- [ ] T117 [US3] Create Zod schema for CreateEntryRequest in backend/src/ui/http/actions/entries/createEntry.ts
- [ ] T118 [US3] Implement createEntry action handler in backend/src/ui/http/actions/entries/createEntry.ts (validate body → map to CreateEntryCommand → call handler which performs domain-level title uniqueness check via repository → if optional rating provided, call AddRatingCommand via handler to avoid duplicating rating logic → return 201 or 409)
- [ ] T119 [US3] Implement getPlatforms action handler in backend/src/ui/http/actions/platforms/getPlatforms.ts
- [ ] T120 [US3] Register POST /api/v1/entries route in backend/src/ui/http/server.ts
- [ ] T121 [US3] Register GET /api/v1/platforms route in backend/src/ui/http/server.ts

### UI Layer Implementation for User Story 3 (Frontend)

- [ ] T122 [US3] Create useCreateEntry hook with TanStack Query mutation in frontend/src/hooks/useCreateEntry.ts
- [ ] T123 [US3] Create usePlatforms hook in frontend/src/hooks/usePlatforms.ts
- [ ] T124 [US3] Implement AddEntryPage in frontend/src/pages/AddEntryPage.tsx (form with title, media type dropdown ('film' or 'series'), tags selector (1-3), platform selector, optional rating)
- [ ] T125 [US3] Add form validation with Zod in AddEntryPage (1-3 tags, unique title, required media type)
- [ ] T126 [US3] Add route for AddEntryPage in frontend/src/App.tsx

**Checkpoint**: All three user stories (US1, US2, US3) should now be independently functional. Users can browse (US1), rate (US2), and add content (US3).

---

## Phase 6: User Story 4 - Filter by Personal Activity (Priority: P3)

**Goal**: Returning users can see what's new since their last visit using "new to me" filter

**Independent Test**: Login, note last login time, have other users add/update content, then return and use the "new to me" filter

### Tests for User Story 4 (TDD - Write FIRST, ensure they FAIL)

#### Backend Tests

- [ ] T127 [P] [US4] Unit test for "new to me" filter logic in GetEntriesQueryHandler (backend/tests/unit/application/queries/GetEntriesQueryHandler.spec.ts - extend existing)
- [ ] T128 [P] [US4] Integration test for newToMe query parameter in backend/tests/integration/application/queries/GetEntriesQuery.spec.ts

#### Frontend Tests

- [ ] T129 [P] [US4] Unit test for "new to me" filter in FilterBar component (frontend/tests/unit/components/FilterBar.spec.tsx - extend existing)

### Implementation for User Story 4

- [ ] T130 [US4] Extend GetEntriesQueryHandler to support newToMe filter in backend/src/application/queries/GetEntriesQueryHandler.ts (filter by created_at/updated_at > user.last_login)
- [ ] T131 [US4] Update last_login timestamp on authentication in backend/src/ui/http/middleware/authMiddleware.ts (async/non-blocking update to avoid delaying authentication response)
- [ ] T132 [US4] Add "New to Me" filter option to FilterBar component in frontend/src/components/FilterBar.tsx
- [ ] T133 [US4] Update useEntries hook to support newToMe parameter in frontend/src/hooks/useEntries.ts

**Checkpoint**: Users can now filter content by personal activity in addition to browsing (US1), rating (US2), and adding content (US3).

---

## Phase 7: User Story 5 - Edit Existing Content (Priority: P3)

**Goal**: Users can update movie/series information to keep the database accurate

**Independent Test**: Edit an existing entry's title or tags and verify the changes are reflected in all views

### Tests for User Story 5 (TDD - Write FIRST, ensure they FAIL)

#### Backend Tests

- [ ] T134 [P] [US5] Unit test for UpdateEntryCommand in backend/tests/unit/application/commands/UpdateEntryCommand.spec.ts
- [ ] T135 [P] [US5] Unit test for UpdateEntryCommandHandler in backend/tests/unit/application/commands/UpdateEntryCommandHandler.spec.ts
- [ ] T136 [P] [US5] Integration test for UpdateEntryCommand flow in backend/tests/integration/application/commands/UpdateEntryCommand.spec.ts
- [ ] T137 [P] [US5] Contract test for PUT /entries/:entryId endpoint in backend/tests/contract/endpoints/updateEntry.spec.ts

#### Frontend Tests

- [ ] T138 [P] [US5] Unit test for edit functionality in EntryDetailsPage in frontend/tests/unit/pages/EntryDetailsPage.spec.tsx

### Application Layer Implementation for User Story 5

- [ ] T139 [US5] Create UpdateEntryCommand in backend/src/application/commands/UpdateEntryCommand.ts
- [ ] T140 [US5] Create UpdateEntryCommandHandler in backend/src/application/commands/UpdateEntryCommandHandler.ts (depends on T051, T052)

### UI Layer Implementation for User Story 5 (Backend)

- [ ] T141 [US5] Create Zod schema for UpdateEntryRequest in backend/src/ui/http/actions/entries/updateEntry.ts
- [ ] T142 [US5] Implement updateEntry action handler in backend/src/ui/http/actions/entries/updateEntry.ts (validate body → check title uniqueness → map to UpdateEntryCommand → call handler → return 200 or 409)
- [ ] T143 [US5] Register PUT /api/v1/entries/:entryId route in backend/src/ui/http/server.ts

### UI Layer Implementation for User Story 5 (Frontend)

- [ ] T144 [US5] Create useUpdateEntry hook with TanStack Query mutation in frontend/src/hooks/useUpdateEntry.ts
- [ ] T145 [US5] Add edit mode UI to EntryDetailsPage in frontend/src/pages/EntryDetailsPage.tsx (inline editing or modal)
- [ ] T146 [US5] Add optimistic updates and cache invalidation for entry updates in frontend/src/hooks/useUpdateEntry.ts

**Checkpoint**: Users can now edit content in addition to all previous functionality.

---

## Phase 8: User Story 6 - Admin Platform Management (Priority: P4)

**Goal**: Admin users can manage streaming platforms and genre tags to maintain data quality

**Independent Test**: Login as admin and manage the streaming platforms and tags lists, verify that in-use items cannot be deleted

### Tests for User Story 6 (TDD - Write FIRST, ensure they FAIL)

#### Backend Tests

- [ ] T147 [P] [US6] Unit test for CreateStreamingPlatformCommand in backend/tests/unit/application/commands/CreateStreamingPlatformCommand.spec.ts
- [ ] T148 [P] [US6] Unit test for DeleteStreamingPlatformCommand in backend/tests/unit/application/commands/DeleteStreamingPlatformCommand.spec.ts
- [ ] T149 [P] [US6] Unit test for CreateGenreTagCommand in backend/tests/unit/application/commands/CreateGenreTagCommand.spec.ts
- [ ] T150 [P] [US6] Unit test for DeleteGenreTagCommand in backend/tests/unit/application/commands/DeleteGenreTagCommand.spec.ts
- [ ] T151 [P] [US6] Integration test for admin authorization in backend/tests/integration/ui/http/middleware/authMiddleware.spec.ts
- [ ] T152 [P] [US6] Contract test for POST /platforms endpoint in backend/tests/contract/endpoints/createPlatform.spec.ts
- [ ] T153 [P] [US6] Contract test for POST /tags endpoint in backend/tests/contract/endpoints/createTag.spec.ts

#### Frontend Tests

- [ ] T154 [P] [US6] Unit test for AdminPage in frontend/tests/unit/pages/AdminPage.spec.tsx
- [ ] T155 [P] [US6] Integration test for admin platform management in frontend/tests/integration/pages/AdminPage.spec.tsx

### Application Layer Implementation for User Story 6

- [ ] T156 [P] [US6] Create CreateStreamingPlatformCommand in backend/src/application/commands/CreateStreamingPlatformCommand.ts
- [ ] T157 [US6] Create CreateStreamingPlatformCommandHandler in backend/src/application/commands/CreateStreamingPlatformCommandHandler.ts (depends on T110)
- [ ] T158 [P] [US6] Create DeleteStreamingPlatformCommand in backend/src/application/commands/DeleteStreamingPlatformCommand.ts
- [ ] T159 [US6] Create DeleteStreamingPlatformCommandHandler in backend/src/application/commands/DeleteStreamingPlatformCommandHandler.ts (depends on T051, T110) - MUST validate platform is not referenced by any entries via IEntryRepository before deletion, throw error if in use (FR-016)
- [ ] T160 [P] [US6] Create CreateGenreTagCommand in backend/src/application/commands/CreateGenreTagCommand.ts
- [ ] T161 [US6] Create CreateGenreTagCommandHandler in backend/src/application/commands/CreateGenreTagCommandHandler.ts (depends on T052)
- [ ] T162 [P] [US6] Create DeleteGenreTagCommand in backend/src/application/commands/DeleteGenreTagCommand.ts
- [ ] T163 [US6] Create DeleteGenreTagCommandHandler in backend/src/application/commands/DeleteGenreTagCommandHandler.ts (depends on T051, T052) - MUST validate tag is not referenced by any entries via IEntryRepository before deletion, throw error if in use (FR-017)

### UI Layer Implementation for User Story 6 (Backend)

- [ ] T164 [US6] Create admin authorization middleware in backend/src/ui/http/middleware/adminMiddleware.ts
- [ ] T165 [P] [US6] Create Zod schema and implement createPlatform action in backend/src/ui/http/actions/platforms/createPlatform.ts
- [ ] T166 [P] [US6] Implement deletePlatform action in backend/src/ui/http/actions/platforms/deletePlatform.ts
- [ ] T167 [P] [US6] Create Zod schema and implement createTag action in backend/src/ui/http/actions/tags/createTag.ts
- [ ] T168 [P] [US6] Implement deleteTag action in backend/src/ui/http/actions/tags/deleteTag.ts
- [ ] T169 [US6] Register POST /api/v1/platforms route with admin middleware in backend/src/ui/http/server.ts
- [ ] T170 [US6] Register DELETE /api/v1/platforms/:platformId route with admin middleware in backend/src/ui/http/server.ts
- [ ] T171 [US6] Register POST /api/v1/tags route with admin middleware in backend/src/ui/http/server.ts
- [ ] T172 [US6] Register DELETE /api/v1/tags/:tagId route with admin middleware in backend/src/ui/http/server.ts

### UI Layer Implementation for User Story 6 (Frontend)

- [ ] T173 [P] [US6] Create useCreatePlatform hook in frontend/src/hooks/useCreatePlatform.ts
- [ ] T174 [P] [US6] Create useDeletePlatform hook in frontend/src/hooks/useDeletePlatform.ts
- [ ] T175 [P] [US6] Create useCreateTag hook in frontend/src/hooks/useCreateTag.ts
- [ ] T176 [P] [US6] Create useDeleteTag hook in frontend/src/hooks/useDeleteTag.ts
- [ ] T177 [US6] Implement AdminPage in frontend/src/pages/AdminPage.tsx (platform and tag management UI)
- [ ] T178 [US6] Add admin route protection in frontend/src/App.tsx
- [ ] T179 [US6] Add admin navigation link (conditionally shown) in frontend/src/App.tsx

**Checkpoint**: Admin users can now manage platforms and tags, completing all user stories.

---

## Phase 9: Additional Features - User Account Deletion

**Goal**: Support user account deletion with data anonymization

**Independent Test**: Delete a user account and verify entries/ratings are preserved with "Deleted User" reference

### Tests (TDD - Write FIRST, ensure they FAIL)

- [ ] T180 [P] Unit test for DeleteUserCommand in backend/tests/unit/application/commands/DeleteUserCommand.spec.ts
- [ ] T181 [P] Integration test for user anonymization in backend/tests/integration/application/commands/DeleteUserCommand.spec.ts (MUST verify entries/ratings preserve data with user reference replaced by "Deleted User" per FR-019)
- [ ] T182 [P] Contract test for DELETE /users/me endpoint in backend/tests/contract/endpoints/deleteUser.spec.ts

### Application Layer Implementation

- [ ] T183 Create DeleteUserCommand in backend/src/application/commands/DeleteUserCommand.ts
- [ ] T184 Create DeleteUserCommandHandler in backend/src/application/commands/DeleteUserCommandHandler.ts (depends on T050, anonymizes data)
- [ ] T184a Add validation to DeleteUserCommandHandler to prevent deletion of last admin user (query IUserRepository for admin count, throw error if user is last admin)

### UI Layer Implementation (Backend)

- [ ] T185 Implement deleteUser action handler in backend/src/ui/http/actions/users/deleteUser.ts
- [ ] T186 Register DELETE /api/v1/users/me route in backend/src/ui/http/server.ts

### UI Layer Implementation (Frontend)

- [ ] T187 Create useDeleteAccount hook in frontend/src/hooks/useDeleteAccount.ts
- [ ] T188 Add account deletion UI to user profile/settings page

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T189 [P] Add comprehensive API documentation (Swagger UI) to backend/src/ui/http/server.ts
- [ ] T190 [P] Add loading states and error handling to all frontend components
- [ ] T191 [P] Add input validation error messages to all frontend forms
- [ ] T192 [P] Implement proper CORS configuration for production in backend/src/ui/http/server.ts
- [ ] T193 [P] Add database connection pooling optimization in backend/src/infrastructure/persistence/DatabaseConnection.ts
- [ ] T194 [P] Add comprehensive logging throughout backend application
- [ ] T195 [P] Create production build scripts for backend and frontend
- [ ] T197 [P] Add health check endpoint at /health in backend/src/ui/http/server.ts
- [ ] T198 [P] Create frontend production environment configuration
- [ ] T199 [P] Add accessibility improvements (ARIA labels, keyboard navigation) to frontend components
- [ ] T200 [P] Add responsive design improvements for mobile devices
- [ ] T201 [P] Optimize frontend bundle size (code splitting, lazy loading)
- [ ] T202 Validate quickstart.md against implemented application
- [ ] T203 Update README.md with deployment instructions
- [ ] T204 [P] Add security headers to HTTP responses
- [ ] T205 [P] Add rate limiting to API endpoints

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Additional Features (Phase 9)**: Depends on Phase 2 (can be done in parallel with user stories)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Browse**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2) - Rate**: Can start after Foundational (Phase 2) - No dependencies, but benefits from US1 for viewing ratings
- **User Story 3 (P3) - Add Content**: Can start after Foundational (Phase 2) - No dependencies, integrates with US1 for display
- **User Story 4 (P3) - Filter**: Extends US1 - Can start after Foundational, requires last_login tracking
- **User Story 5 (P3) - Edit**: Extends US1/US3 - Can start after Foundational
- **User Story 6 (P4) - Admin**: Can start after Foundational (Phase 2) - Independent admin features

### Within Each User Story (TDD Pattern)

1. **Tests FIRST**: Write all tests for the story and ensure they FAIL (Red)
2. **Domain Layer**: Create entities, value objects, repository interfaces (Green)
3. **Application Layer**: Create commands/queries and handlers (Green)
4. **Infrastructure Layer**: Implement repositories (Green)
5. **UI Layer**: Create HTTP actions and routes, frontend components (Green)
6. **Refactor**: Clean up code while keeping tests green (Refactor)
7. **Story Complete**: All tests pass, story independently testable

### Parallel Opportunities

#### Phase 1 (Setup)
- T004, T005, T006, T007, T008, T009, T011, T012 can run in parallel

#### Phase 2 (Foundational)
- Backend: T016, T017, T018, T019, T023, T024 can run in parallel
- Frontend: T025, T026, T027, T028 can run in parallel
- Backend and Frontend foundational work can proceed in parallel

#### Within Each User Story
- **All tests can run in parallel** (T029-T043 for US1, etc.)
- **All domain entities can be created in parallel** (T044-T048 for US1, etc.)
- **All repository interfaces can be created in parallel** (T050-T053 for US1, etc.)
- **Frontend components can be built in parallel** (T073-T077 for US1, etc.)

#### Across User Stories (After Foundational Phase)
- Once Phase 2 completes, US1, US2, US3, US4, US5, and US6 can all be worked on by different team members in parallel
- Each story is independently testable and deployable

---

## Parallel Example: User Story 1

```bash
# Write all tests together (they will fail - that's expected in TDD):
T029: Unit test for Entry entity
T030: Unit test for GenreTag entity
T031: Unit test for EntryFilters value object
T032: Unit test for GetEntriesQueryHandler
T033: Unit test for GetEntryDetailsQueryHandler
T034: Integration test for PostgresEntryRepository
T035: Integration test for GetEntriesQuery flow
T036: Contract test for GET /entries
T037: Contract test for GET /entries/:entryId
T038-T043: All frontend tests

# Create all domain entities in parallel:
T044: User entity
T045: Entry entity
T046: GenreTag entity
T047: StreamingPlatform entity
T048: Rating entity
T049: EntryFilters value object

# Create all repository interfaces in parallel:
T050: IUserRepository
T051: IEntryRepository
T052: IGenreTagRepository
T053: IRatingRepository

# Create all frontend components in parallel:
T073: EntryCard component
T074: EntryList component
T075: FilterBar component
T076: Pagination component
T077: EntryDetails component
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Browse and Discover)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Can users browse entries?
   - Does filtering by tags work?
   - Does pagination work correctly?
   - Can users view entry details with ratings?
5. Deploy/demo MVP

**MVP Value**: Users can immediately discover and browse community-rated content without needing to contribute first.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! Users can browse)
3. Add User Story 2 → Test independently → Deploy/Demo (Users can now rate)
4. Add User Story 3 → Test independently → Deploy/Demo (Users can now add content)
5. Add User Story 4 → Test independently → Deploy/Demo (Users can filter personal activity)
6. Add User Story 5 → Test independently → Deploy/Demo (Users can edit content)
7. Add User Story 6 → Test independently → Deploy/Demo (Admins can manage platforms/tags)
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (critical path)
2. **Once Foundational is done**, split work:
   - Developer A: User Story 1 (Browse) - MVP priority
   - Developer B: User Story 2 (Ratings)
   - Developer C: User Story 3 (Add Content)
3. After US1-3 complete:
   - Developer A: User Story 4 (Filter)
   - Developer B: User Story 5 (Edit)
   - Developer C: User Story 6 (Admin)
4. All developers: Polish & Cross-Cutting Concerns
5. Stories integrate cleanly due to DDD architecture and independent design

---

## Task Summary

- **Total Tasks**: 204
- **Phase 1 (Setup)**: 12 tasks
- **Phase 2 (Foundational)**: 16 tasks (backend + frontend foundation)
- **Phase 3 (US1 - Browse)**: 55 tasks (includes comprehensive tests)
- **Phase 4 (US2 - Rate)**: 19 tasks
- **Phase 5 (US3 - Add Content)**: 26 tasks
- **Phase 6 (US4 - Filter)**: 7 tasks
- **Phase 7 (US5 - Edit)**: 14 tasks
- **Phase 8 (US6 - Admin)**: 34 tasks
- **Phase 9 (Account Deletion)**: 9 tasks
- **Phase 10 (Polish)**: 17 tasks

### Parallel Opportunities Identified

- **Setup Phase**: 8 tasks can run in parallel
- **Foundational Phase**: 8 tasks can run in parallel (within backend/frontend groups)
- **User Story 1**: 30+ tasks can run in parallel (tests, entities, components)
- **Across Stories**: After foundational phase, 6 user stories can be developed in parallel by different team members

### Independent Test Criteria

- **US1**: Browse entries, filter by tags, paginate, view details → No dependencies on other features
- **US2**: Add/update ratings → Requires US1 for viewing but rating logic is independent
- **US3**: Add new entries → Requires US1 for display but creation logic is independent
- **US4**: Filter by "new to me" → Extends US1 filtering
- **US5**: Edit entries → Extends US1/US3 entry management
- **US6**: Admin management → Completely independent admin features

### Suggested MVP Scope

**Minimum Viable Product**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1)

**Why**: User Story 1 delivers immediate value - users can browse and discover community-rated content without needing to contribute first. This validates the core browsing and discovery UX before investing in content creation features.

**MVP Validation Checklist**:
- [ ] Users can browse paginated list of entries
- [ ] Users can filter entries by genre tags
- [ ] Users can view detailed entry information with ratings
- [ ] Average ratings calculate correctly
- [ ] Pagination performs within 2 seconds per page
- [ ] Entry lists load within 3 seconds with 1000+ entries

---

## Notes

- **[P] tasks** = different files, no dependencies on incomplete tasks
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD Required**: Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Constitution Compliance**: All code follows TypeScript standards (single quotes, crypto.randomUUID(), early returns, Zod validation)
- **DDD Principles**: Strict layering maintained (Domain → Application → Infrastructure → UI)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
