# AGENTS.md — Team Architecture & Governance

## Project Overview
**Aleppo Real Estate** is a modern real estate web platform.

## Agent Team Roles & Responsibilities

### MAIN AGENT (Project Manager & Coordinator)
- **Role:** Planning, task decomposition, task allocation, code/architecture review, API contract oversight, integration verification, user communication.
- **Ownership:** Project root governance, `AGENTS.md`, `docs/*`, `tasks/BACKLOG.md`.

### SUB-AGENT 1 — ASP.NET Core Senior (`aspnet_core_senior`)
- **Role:** Senior ASP.NET Core / .NET 9 Developer. Clean Architecture, Vertical Slice Architecture, CQRS, MediatR, EF Core, SQL Server, FluentValidation, REST APIs, Auth, Performance & Security.
- **Ownership:** `src/Domain/`, `src/Application/`, `src/Infrastructure/`, `src/Web/Endpoints/`.

### SUB-AGENT 2 — Angular Senior (`angular_senior`)
- **Role:** Senior Angular Developer. Modern Angular standalone components, modern control flow (`@if`, `@for`, `@switch`), Tailwind CSS, RTL Arabic UI, Responsive Web Design, API integration, Forms, State Management.
- **Ownership:** `src/Web/ClientApp/`.

## Shared Communication & Handoff Protocols
1. Backend changes must be updated in `docs/api-contract.md` and `docs/database.md`.
2. Frontend updates must reference `docs/api-contract.md`.
3. Handoffs are documented under `docs/handoffs/`.
