# Architecture Overview — Aleppo Real Estate

## System Architecture

### Backend (.NET 9 Web API)
- **Framework:** ASP.NET Core (.NET 9)
- **Pattern:** Clean Architecture with vertical feature slices
- **CQRS:** MediatR commands and queries
- **Data Access:** Entity Framework Core 9 with SQL Server in production
- **Validation:** FluentValidation
- **Authentication:** JWT bearer tokens with role- and ownership-based authorization

### Frontend (Angular 22)
- **Framework:** Angular 22 standalone components
- **Control Flow:** `@if`, `@for`, and `@switch`
- **Routing:** Lazy-loaded standalone feature components
- **Styling:** Tailwind CSS, responsive Arabic RTL layout
- **UI Libraries:** No Bootstrap or PrimeNG

### Communication Contract
- REST APIs with JSON payloads.
- `docs/api-contract.md` is the contract source for the client and API.
- Angular uses relative `/api` URLs; production should route the client and API through a same-origin reverse proxy unless an API base URL is introduced and verified.

## Domain Architecture & Relationships

### Agency & Agent Profiles
- A `User` may have one `AgentProfile` when acting as an agent.
- An `AgentProfile` may optionally belong to an `Agency`; independent agents are supported.
- Agent and agency public projections exclude private authentication data.

### Users & Properties
- Properties are associated with their creator through `OwnerId`.
- Property edit, archive, and image operations require ownership or administrative authorization.
- Public agent property queries exclude archived properties.

### Inquiries, Notifications & Chat
- Buyers submit property inquiries; the property's owner manages status and private agent notes.
- Notifications are scoped to their recipient.
- `ChatMessage` records sender, receiver, optional property reference, message content, and read state. Chat endpoints require authentication; the existing UI/API provide message retrieval and send, not a real-time transport.

### User Profile & Security
- Profile endpoints permit only intended personal fields to change; role, email, ID, and creation time are not user-editable.
- Password changes verify the existing password and store a password hash.
- JWT signing keys are supplied through environment configuration. There is no committed or hard-coded production signing key.

## Production Operations
- Development defaults to an in-memory database and development-only demo-data seeding.
- Outside Development, SQL Server and a connection string are required. Migrations default to a separate release step.
- Production startup requires explicit allowed hosts and a CORS origin allow-list.
- Property image uploads currently use local filesystem storage at `wwwroot/uploads/properties`; production requires a persistent volume or a verified object-storage implementation.
- Deployment topology, secret configuration, migration, backup, and release checks are documented in `docs/deployment.md`. No production host or deployment has been verified yet.
