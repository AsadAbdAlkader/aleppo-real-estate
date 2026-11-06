# System Requirements — Aleppo Real Estate

## Functional Overview
Aleppo Real Estate is a web application for listing, searching, filtering, and managing real estate properties in Aleppo.

### Core Features
1. **Property Marketplace:** Browse paginated listings; view details; search, filter, and sort by category, purpose, price, location, and property features.
2. **Property Owner Tools:** Create and manage listings, archive properties, upload and manage listing images, and review inquiries for owned properties.
3. **Accounts & Roles:** Register, log in, update a profile, change a password, and apply Buyer, Agent, and Admin authorization rules.
4. **Agent & Agency Profiles:** Browse agent profiles and listings, create or update an agency as an authorized agent, and manage agent affiliation.
5. **Buyer Engagement:** Save favorites, submit property inquiries, track inquiry status, receive in-app notifications, and exchange authenticated direct messages.
6. **Dashboard:** Provide authenticated users with a summary of their property and inquiry activity.
7. **Arabic Experience:** Provide an Arabic-first responsive interface with RTL layout.

### Security & Operational Requirements
- Derive user identity from the authenticated token and enforce ownership checks on private operations.
- Do not expose password hashes, private inquiry notes, or non-public profile data in public API projections.
- Keep secrets and production environment settings outside committed configuration files.
- Use SQL Server and durable image storage in production; do not use development seed data in production.
- The current direct chat is request/response messaging, not real-time transport. Real-time chat, payments, English localization, and an advanced administrative console are not part of the first release.
