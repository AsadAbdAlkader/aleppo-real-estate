# Frontend Guidelines — Aleppo Real Estate

## Guidelines
- **Framework:** Angular 22 (Standalone Components)
- **Control Flow:** Modern syntax (`@if`, `@for`, `@switch`) - No `*ngIf`, `*ngFor`
- **Styling:** Tailwind CSS with RTL Arabic support (`dir="rtl"`, `lang="ar"`)
- **UI Frameworks:** No third-party Bootstrap or PrimeNG packages added.
- **Routing:** Feature pages are lazy-loaded with standalone `loadComponent` routes to reduce the initial JavaScript bundle.
- **Location:** `src/Web/ClientApp`
- **API Client:** Service layer consuming backend contracts from `docs/api-contract.md`.

The API clients use relative `/api` URLs. Production hosting must serve the client and API behind a same-origin reverse proxy, or introduce and verify a configurable API base URL before using separate origins.

## App Structure
- `src/Web/ClientApp/src/index.html`: RTL Arabic configuration (`dir="rtl"`, `lang="ar"`), Cairo font family.
- `src/Web/ClientApp/tailwind.config.js`: Tailwind config configured for Angular html/ts content and custom primary color palette.
- `src/Web/ClientApp/src/app/features/landing/`: `LandingComponent` displaying Arabic real estate listings with search/filtering capabilities and modern Angular control flow syntax.
