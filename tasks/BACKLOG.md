# Tasks Backlog — Aleppo Real Estate

## Task Board

> The original roadmap rows record completion of feature-development phases, not a verified live production launch. `docs/handoffs/FINAL-AUDIT.md` has been superseded by a current readiness update. Chat work was delivered under handoff IDs that overlap with earlier backlog IDs; treat the historical labels as inconsistent until the task history is reconciled.

| Task ID | Title | Assigned Agent | Status | Dependencies | Affected Areas |
|---|---|---|---|---|---|
| BE-001 | Initialize .NET 9 Web API Clean Architecture Solution | ASP.NET Core Senior | DONE | None | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-001 | Initialize Angular Standalone App with Tailwind CSS & RTL | Angular Senior | DONE | None | `src/Web/ClientApp` |
| BE-002 | Implement Property Domain Entity, EF Core Context & CQRS Property Endpoints | ASP.NET Core Senior | DONE | BE-001 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-002 | Implement Property Service & Listings UI Component in Angular | Angular Senior | DONE | FE-001 | `src/Web/ClientApp` |
| FE-FIX-001 | Restrict PropertyService Mock Fallback strictly to Development Mode | Angular Senior | DONE | FE-002 | `src/Web/ClientApp` |
| INT-001 | Integrate Angular Frontend with ASP.NET Core Backend Endpoints & Verify CORS | Main Agent | DONE | BE-002, FE-002 | `src/Web`, `src/Web/ClientApp` |
| BE-003 | Implement Identity / JWT Authentication & Authorization Endpoints | ASP.NET Core Senior | DONE | BE-002 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-003 | Implement Login/Register UI, Auth State, Interceptor & Route Guards | Angular Senior | DONE | FE-002 | `src/Web/ClientApp` |
| INT-002 | Verify End-to-End JWT Auth, Route Protection & Interceptor Flow | Main Agent | DONE | BE-003, FE-003 | `src/Web`, `src/Web/ClientApp` |
| BE-004 | Implement Favorites & Property Inquiry Entities, CQRS & Endpoints | ASP.NET Core Senior | DONE | BE-003 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-004 | Implement Favorites Button, My Favorites Page & Inquiry Modal UI | Angular Senior | DONE | FE-003 | `src/Web/ClientApp` |
| INT-003 | End-to-End Integration Verification & Full Quality Gate Audit | Main Agent | DONE | BE-004, FE-004 | `src/Web`, `src/Web/ClientApp` |
| BE-005 | Implement Full Property CRUD, Ownership Verification & My Properties Endpoint | ASP.NET Core Senior | DONE | BE-004 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-005 | Implement My Properties Page, Add/Edit Property Form Modal & Delete Dialog | Angular Senior | DONE | FE-004 | `src/Web/ClientApp` |
| INT-004 | Integration Verification & Security Ownership Audit for Property CRUD | Main Agent | DONE | BE-005, FE-005 | `src/Web`, `src/Web/ClientApp` |
| BE-006 | Implement Property Image Upload, Storage, Delete & Primary Image CQRS Endpoints | ASP.NET Core Senior | DONE | BE-005 | `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-006 | Implement Image Manager UI, Preview, Primary Badge & Upload Gallery Component | Angular Senior | DONE | FE-005 | `src/Web/ClientApp` |
| INT-005 | End-to-End Integration Verification & Quality Gate Audit for Property Images | Main Agent | DONE | BE-006, FE-006 | `src/Web`, `src/Web/ClientApp` |
| BE-007 | Implement Server-Side Advanced Search, Multi-Filter, Sorting & Database Indexes | ASP.NET Core Senior | DONE | BE-006 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-007 | Implement Advanced Search Bar, Filter Panel & URL Query Params Binding | Angular Senior | DONE | FE-006 | `src/Web/ClientApp` |
| INT-006 | Integration Verification & Quality Gate Audit for Advanced Search & Filters | Main Agent | DONE | BE-007, FE-007 | `src/Web`, `src/Web/ClientApp` |
| BE-008 | Implement User Dashboard CQRS Aggregation Query & Protected Endpoint | ASP.NET Core Senior | DONE | BE-007 | `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-008 | Implement Dashboard Page, Real-Time Stats Cards, Recent Lists & Quick Actions | Angular Senior | DONE | FE-007 | `src/Web/ClientApp` |
| INT-007 | End-to-End Integration Verification & Quality Gate Audit for User Dashboard | Main Agent | DONE | BE-008, FE-008 | `src/Web`, `src/Web/ClientApp` |
| BE-009 | Refine Property Details CQRS Query, Owner Info Projection & Archived Guard | ASP.NET Core Senior | DONE | BE-008 | `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-009 | Implement Property Details Page, Image Gallery, Specs, Actions & Owner Card | Angular Senior | DONE | FE-008 | `src/Web/ClientApp` |
| INT-008 | End-to-End Integration Verification & Quality Gate Audit for Property Details Page | Main Agent | DONE | BE-009, FE-009 | `src/Web`, `src/Web/ClientApp` |
| BE-010 | Implement AgentProfile Entity, Seed Data, CQRS Queries & Agent Endpoints | ASP.NET Core Senior | DONE | BE-009 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-010 | Implement AgentService, Agent Directory UI (/agents) & Agent Details UI (/agents/:id) | Angular Senior | DONE | FE-009 | `src/Web/ClientApp` |
| INT-009 | End-to-End Integration Verification & Quality Gate Audit for Agent Directory & Details | Main Agent | DONE | BE-010, FE-010 | `src/Web`, `src/Web/ClientApp` |
| BE-011 | Implement Inquiry Status & AgentNotes, Received Inquiries CQRS & Endpoints | ASP.NET Core Senior | DONE | BE-010 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-011 | Implement Status Badges in /inquiries & Received Inquiries UI (/my-property-inquiries) | Angular Senior | DONE | FE-010 | `src/Web/ClientApp` |
| INT-010 | End-to-End Integration Verification & Security Ownership Audit for Inquiries Lifecycle | Main Agent | DONE | BE-011, FE-011 | `src/Web`, `src/Web/ClientApp` |
| BE-012 | Implement Notification Domain Entity, EF Core Context & Migration, In-Process Handlers & Endpoints | ASP.NET Core Senior | DONE | BE-011 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-012 | Implement NotificationService, Header Bell Icon, Unread Badge & Dropdown UI in Angular | Angular Senior | DONE | FE-011 | `src/Web/ClientApp` |
| INT-011 | End-to-End Integration Verification & Security Audit for In-App Notifications Subsystem | Main Agent | DONE | BE-012, FE-012 | `src/Web`, `src/Web/ClientApp` |
| BE-013 | Implement User Profile Entity Field, CQRS Queries/Commands & Security Settings Endpoints | ASP.NET Core Senior | DONE | BE-012 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-013 | Implement Profile Management UI (/profile), Password Change Tab & Signal State | Angular Senior | DONE | FE-012 | `src/Web/ClientApp` |
| INT-012 | End-to-End Integration Verification & Security Audit for Profile & Password Subsystem | Main Agent | DONE | BE-013, FE-013 | `src/Web`, `src/Web/ClientApp` |
| BE-014 | Implement Agency & AgentProfile Create/Update CQRS Commands & Protected Endpoints | ASP.NET Core Senior | DONE | BE-013 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-014 | Implement Agent Profile Edit Form & Agency Management UI in Angular | Angular Senior | DONE | FE-013 | `src/Web/ClientApp` |
| INT-013 | End-to-End Integration Verification & Security Audit for Agency & Agent Profile Subsystem | Main Agent | DONE | BE-014, FE-014 | `src/Web`, `src/Web/ClientApp` |
| BE-015 | Implement Real-Time Direct Property Chat Subsystem, EF Core Table & Endpoints | ASP.NET Core Senior | DONE | BE-014 | `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web` |
| FE-015 | Implement Standalone Direct Property Chat UI (/messages), Signal State & Header Badge | Angular Senior | DONE | FE-014 | `src/Web/ClientApp` |
| INT-014 | Historical Quality Gate Audit & Architecture Baseline | Main Agent | DONE | BE-015, FE-015 | Entire Solution |
| INT-015 | End-to-End Direct Property Chat & Master 32-Point Quality Gate Audit | Main Agent | DONE | BE-015, FE-015 | Entire Solution |
| BE-016 | Add PostgreSQL & pgAdmin 4 Provider Support, Npgsql Integration & DDL Script | ASP.NET Core Senior | DONE | BE-015 | `src/Infrastructure`, `src/Web`, `docker-compose.yml`, `docs/database.md` |

### Release Readiness Follow-up

| Task ID | Title | Assigned Agent | Status | Dependencies | Affected Areas |
|---|---|---|---|---|---|
| REL-001 | Re-establish Current Build and Test Baseline | Main Agent | DONE | None | Backend, frontend, release evidence |
| REL-002 | Reconcile Current Documentation and Backlog | Main Agent | DONE | REL-001 | `docs/*`, `tasks/BACKLOG.md` |
| REL-003 | Harden Production Configuration Boundaries & CI Workflow | Main Agent | DONE | REL-001 | `src/Web`, `src/Infrastructure`, `.github/workflows`, `tests/` |
| REL-004 | Validate Release in Staging | Main Agent | BLOCKED | REL-002, REL-003 | Staging environment, database, image storage |
| REL-005 | Deploy Production Release | Main Agent | BLOCKED | REL-004 | Hosting, DNS, HTTPS, operations |

`REL-003` is completed with full GitHub Actions CI pipeline, .NET 9 Release build, Angular 19 production bundle verification, 30 backend unit tests, 115 Angular unit tests, and 32 live HTTP scenario tests. `REL-004` and `REL-005` remain blocked pending user provisioning of actual external staging/production infrastructure and credentials.



## Task Details

### BE-014: Implement Agency & AgentProfile Create/Update CQRS Commands & Protected Endpoints
- **Description:** Implement `CreateAgencyCommand` & `UpdateAgencyCommand` (creating/editing real estate agency metadata: `Name`, `Description`, `PhoneNumber`, `Address`, `CityArea`, `LogoUrl`, `LicenseNumber`), `UpdateAgentProfileCommand` (editing `Bio`, `PublicPhone`, `AgencyId` link). Implement endpoints `POST /api/agencies`, `PUT /api/agencies/{id}`, `PUT /api/agents/me` (.RequireAuthorization()). Enforce role authorization (`Agent` or `Admin` for agency management; `Agent` role for agent profile).
- **Assigned Sub-Agent:** ASP.NET Core Senior (`aspnet_core_senior`)
- **Dependencies:** BE-013
- **Files/Areas Affected:** `src/Application/Agencies`, `src/Application/Agents`, `src/Web/Endpoints`

### FE-014: Implement Agent Profile Edit Form & Agency Management UI in Angular
- **Description:** Update `AgentService` with `createAgency(dto)`, `updateAgency(id, dto)`, `updateMyProfile(dto)`. Implement Standalone Agent Profile Edit form tab in `/profile` (visible for `Role === 'Agent'`) for updating `Bio`, `PublicPhone`, and selecting affiliated `Agency`. Implement Agency Create/Edit modal in `/agents` directory or `/profile`. Modern Angular control flow (`@if`, `@for`, `@switch`), Signals, Tailwind CSS, RTL.
- **Assigned Sub-Agent:** Angular Senior (`angular_senior`)
- **Dependencies:** FE-013
- **Files/Areas Affected:** `src/Web/ClientApp/src/app/core/services`, `src/Web/ClientApp/src/app/features/agents`, `src/Web/ClientApp/src/app/features/profile`

### INT-013: End-to-End Integration Verification & Security Audit for Agency & Agent Profile Subsystem
- **Description:** Audit Agent role authorization for agency management and profile updates, verify non-agents get 403 Forbidden, verify agency affiliation updates `AgentProfile.AgencyId`, run live HTTP scenario tests, `dotnet build`, `dotnet test`, `npm run build`, and `npx ng test`.
- **Assigned Sub-Agent:** Main Agent
- **Dependencies:** BE-014, FE-014


### BE-013: Implement User Profile Entity Field, CQRS Queries/Commands & Security Settings Endpoints
- **Description:** Add `PhoneNumber` (nullable string, max 50) to `User.cs`, create EF Core migration `AddUserPhoneNumber`. Implement `GetUserProfileQuery`, `UpdateUserProfileCommand` (for `FirstName`, `LastName`, `PhoneNumber` only; strictly forbids modifying `Email`, `Role`, `Id`, `CreatedAt`), `ChangePasswordCommand` (verifies `CurrentPassword` with existing `IPasswordHasher`, enforces `MinimumLength(6)` password policy). Implement Minimal API endpoints `GET /api/users/profile`, `PUT /api/users/profile`, `PUT /api/users/change-password` (.RequireAuthorization()). Extract `UserId` strictly from claims.
- **Assigned Sub-Agent:** ASP.NET Core Senior (`aspnet_core_senior`)
- **Dependencies:** BE-012
- **Files/Areas Affected:** `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web`

### FE-013: Implement Profile Management UI (/profile), Password Change Tab & Signal State
- **Description:** Update `auth.model.ts` and `AuthService` to include `UserProfile`, `updateProfile()`, `changePassword()`. Update `currentUser` signal and `localStorage` upon profile update. Implement standalone `ProfileComponent` (`/profile`, protected by `authGuard`) with Tab 1 (Personal Info: `FirstName`, `LastName`, `Email` [read-only], `Role` badge, `PhoneNumber`) and Tab 2 (Security: `CurrentPassword`, `NewPassword`, `ConfirmPassword` with password policy validation and feedback alerts). Modern Angular control flow (`@if`, `@for`, `@switch`), Signals, Tailwind CSS, RTL.
- **Assigned Sub-Agent:** Angular Senior (`angular_senior`)
- **Dependencies:** FE-012
- **Files/Areas Affected:** `src/Web/ClientApp/src/app/core/services`, `src/Web/ClientApp/src/app/features/profile`

### INT-012: End-to-End Integration Verification & Security Audit for Profile & Password Subsystem
- **Description:** Audit user profile data isolation, verify current password validation rejects wrong password with 400 Bad Request, verify new password succeeds for login, verify `currentUser` signal updates dynamically, run live HTTP scenario tests, `dotnet build`, `dotnet test`, `npm run build`, and `npx ng test`.
- **Assigned Sub-Agent:** Main Agent
- **Dependencies:** BE-013, FE-013


### BE-012: Implement Notification Domain Entity, EF Core Context & Migration, In-Process Handlers & Endpoints
- **Description:** Implement `Notification` entity, EF Core composite index `(UserId, IsRead, CreatedAt)`, migration `AddNotificationsTable`. Update `CreateInquiryCommandHandler` and `UpdateInquiryStatusCommandHandler` to atomically add `Notification` entity in same DbContext without separate `SaveChangesAsync`. Implement `GetNotificationsQuery`, `GetUnreadNotificationsCountQuery`, `MarkNotificationAsReadCommand` (returning 404 for non-owner), `MarkAllNotificationsAsReadCommand`, and endpoints `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`.
- **Assigned Sub-Agent:** ASP.NET Core Senior (`aspnet_core_senior`)
- **Dependencies:** BE-011
- **Files/Areas Affected:** `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web`

### FE-012: Implement NotificationService, Header Bell Icon, Unread Badge & Dropdown UI in Angular
- **Description:** Implement `NotificationService` with `isDevMode()` fallback only (showing real errors in production). Add Header Bell icon with unread badge counter (`Signals`) and dropdown panel showing recent notifications, "Mark all as read" button, and direct navigation links (`/my-property-inquiries` / `/inquiries`) upon clicking notification. Preserve existing UI identity, Tailwind CSS Slate/Indigo/Sky palette, RTL, and modern control flow (`@if`, `@for`, `@switch`).
- **Assigned Sub-Agent:** Angular Senior (`angular_senior`)
- **Dependencies:** FE-011
- **Files/Areas Affected:** `src/Web/ClientApp/src/app/core/services`, `src/Web/ClientApp/src/app/core/components/header`

### INT-011: End-to-End Integration Verification & Security Audit for In-App Notifications Subsystem
- **Description:** Audit user notification isolation, verify `PUT /api/notifications/{id}/read` returns 404 for notifications owned by other users, verify atomic transaction creation on inquiry creation and status update, run HTTP scenario tests, `dotnet build`, `dotnet test`, `npm run build`, and `npx ng test`.
- **Assigned Sub-Agent:** Main Agent
- **Dependencies:** BE-012, FE-012


### BE-009: Refine Property Details CQRS Query, Owner Info Projection & Archived Guard
- **Description:** Refine `GetPropertyByIdQuery.cs`. Include safe public owner info (`OwnerName`), project `PropertyDto` using `AsNoTracking()`. Return `404 Not Found` if property does not exist or if `Status == "Archived"` for anonymous requests.
- **Assigned Sub-Agent:** ASP.NET Core Senior (`aspnet_core_senior`)
- **Dependencies:** BE-008
- **Files/Areas Affected:** `src/Application/Properties`, `src/Web/Endpoints`

### FE-009: Implement Property Details Page, Image Gallery, Specs, Actions & Owner Card
- **Description:** Implement `PropertyDetailComponent` (`/properties/:id`). Features: Image Gallery, Property Specifications grid, Description section, User Action triggers, Owner / Agent Card, Loading skeleton, Property Not Found 404 state, Error state.
- **Assigned Sub-Agent:** Angular Senior (`angular_senior`)
- **Dependencies:** FE-008
- **Files/Areas Affected:** `src/Web/ClientApp/src/app/core/services`, `src/Web/ClientApp/src/app/features/properties`

### INT-008: End-to-End Integration Verification & Quality Gate Audit for Property Details Page
- **Description:** Perform real empirical execution testing verifying valid property details route, 404 missing property route, archived property restriction, image gallery interactions, favorite toggle from details page, inquiry submission from details page, sensitive data protection audit, backend build, frontend build, and unit tests.
- **Assigned Sub-Agent:** Main Agent
- **Dependencies:** BE-009, FE-009

### BE-010: Implement AgentProfile Entity, Seed Data, CQRS Queries & Agent Endpoints
- **Description:** Implement `AgentProfile` entity (1-to-1 link with `User` where `Role == "Agent"`), EF Core migration/configuration, seed demo agent profiles, CQRS queries (`GetAgentsQuery`, `GetAgentByIdQuery`, `GetAgentPropertiesQuery`, `UpdateAgentProfileCommand`), and Minimal API endpoints (`GET /api/agents`, `GET /api/agents/{id}`, `GET /api/agents/{id}/properties`, `PUT /api/agents/me`).
- **Assigned Sub-Agent:** ASP.NET Core Senior (`aspnet_core_senior`)
- **Dependencies:** BE-009
- **Files/Areas Affected:** `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web`

### FE-010: Implement AgentService, Agent Directory UI (/agents) & Agent Details UI (/agents/:id)
- **Description:** Implement `AgentService`, `/agents` directory page (`AgentListComponent` with search filter, agent cards grid, active properties count, public contact trigger, loading/empty/error states), and `/agents/:id` details page (`AgentDetailComponent` with agent header profile, bio, public contact details, paginated list of public active properties).
- **Assigned Sub-Agent:** Angular Senior (`angular_senior`)
- **Dependencies:** FE-009
- **Files/Areas Affected:** `src/Web/ClientApp/src/app/core/services`, `src/Web/ClientApp/src/app/features/agents`

### INT-009: End-to-End Integration Verification & Quality Gate Audit for Agent Directory & Details
- **Description:** Perform real empirical execution testing verifying `/api/agents`, `/api/agents/{id}`, and `/api/agents/{id}/properties`, ensuring zero sensitive user data leak (no password hashes, no emails), verifying archived property filtering, checking pagination, verifying Angular Standalone UI binding, building both projects cleanly, and executing tests.
- **Assigned Sub-Agent:** Main Agent
- **Dependencies:** BE-010, FE-010

### BE-011: Implement Inquiry Status & AgentNotes, Received Inquiries CQRS & Endpoints
- **Description:** Add `Status` (`New`, `Contacted`, `Closed`) and `AgentNotes` (nullable, max 2000 chars) to `PropertyInquiry.cs`. Update `BaseEntity.UpdatedAt` upon status change. Enforce property ownership isolation (`Property.OwnerId == currentUserId`). Create `GetReceivedInquiriesQuery` (paginated, with status filter) and `UpdateInquiryStatusCommand`. Add `GET /api/inquiries/received` and `PUT /api/inquiries/{id}/status`.
- **Assigned Sub-Agent:** ASP.NET Core Senior (`aspnet_core_senior`)
- **Dependencies:** BE-010
- **Files/Areas Affected:** `src/Domain`, `src/Application`, `src/Infrastructure`, `src/Web`

### FE-011: Implement Status Badges in /inquiries & Received Inquiries UI (/my-property-inquiries)
- **Description:** Update `InquiryService` to support `getReceivedInquiries` and `updateInquiryStatus`. Update `/inquiries` page to display status badges (`جديد`, `تم التواصل`, `مغلق`). Create standalone `/my-property-inquiries` page for property owners to view received inquiries for their properties with status filter tabs, pagination, buyer phone display, inquiry message, property title link, and status/notes update modal.
- **Assigned Sub-Agent:** Angular Senior (`angular_senior`)
- **Dependencies:** FE-010
- **Files/Areas Affected:** `src/Web/ClientApp/src/app/core/services`, `src/Web/ClientApp/src/app/features/inquiries`

### INT-010: End-to-End Integration Verification & Security Ownership Audit for Inquiries Lifecycle
- **Description:** Audit buyer vs property owner data isolation, verify buyer cannot see `AgentNotes` or change status, verify owner cannot see or edit inquiries for properties owned by another user (403 Forbidden), verify status update and `UpdatedAt` timestamp refresh, verify HTTP endpoints, run `dotnet build`, `dotnet test`, `npm run build`, and `npx ng test`.
- **Assigned Sub-Agent:** Main Agent
- **Dependencies:** BE-011, FE-011
