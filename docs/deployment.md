# Deployment & Release Readiness — Aleppo Real Estate

## Current State

The application targets ASP.NET Core/.NET 9 and Angular CLI 22. Its API clients use relative `/api` URLs, and uploaded property images are written to the local `wwwroot/uploads/properties` directory.

The repository includes:
- Multi-stage production `Dockerfile` building both Angular frontend and .NET 9 API into a single deployable image.
- `docker-compose.yml` orchestrating the application, Microsoft SQL Server 2022, volume persistence, and database health check.
- GitHub Actions CI workflow in `.github/workflows/ci.yml`.
- Standard SPA publish target in `Web.csproj` and `MapFallbackToFile("index.html")` in `Program.cs`.

## Required Production Configuration

Provide configuration through the hosting provider's secret/configuration manager or container environment variables, not committed files:

| Key | Requirement |
|---|---|
| `JwtSettings:Secret` | Secret signing key with at least 32 UTF-8 bytes. Rotate it through the provider's secret manager. |
| `JwtSettings:Issuer` | Production API issuer identifier. |
| `JwtSettings:Audience` | Production client audience identifier. |
| `UseInMemoryDatabase` | Set to `false`. The API refuses in-memory storage outside Development. |
| `ConnectionStrings:DefaultConnection` | Production SQL Server connection string. |
| `AllowedHosts` | Specific production host names separated by semicolons; wildcard `*` is rejected outside Development. |
| `Cors:AllowedOrigins:0` | Exact HTTPS origin of the browser client. Add only additional trusted origins as needed. |
| `Database:ApplyMigrationsOnStartup` | Set to `true` or run migrations as a release step. |

ASP.NET Core environment variables use double underscores for nested keys, for example `JwtSettings__Secret`, `ConnectionStrings__DefaultConnection`, and `Cors__AllowedOrigins__0`.

The application generates a temporary random signing key when running in Development without a configured key. Production startup fails when the signing key or other required production settings are absent.

Demo data is seeded only in Development. Do not copy demonstration accounts or records into production.

## Database & Images

1. Provision SQL Server and a least-privilege application identity.
2. Apply EF Core migrations before routing production traffic, using the release environment's secure connection configuration:

   ```text
   dotnet ef database update --project src/Infrastructure --startup-project src/Web --configuration Release
   ```

3. Configure automated encrypted backups and verify a restore to a separate environment before launch.
4. Mount durable persistent storage for the API's local `wwwroot/uploads/properties` directory (configured via `property_uploads` volume in `docker-compose.yml`).
5. Define image retention, backup, access, and recovery procedures alongside the database procedures.

## Hosting Topology & Container Deployment

The application is configured with:
1. `UseForwardedHeaders` enabled for `X-Forwarded-For` and `X-Forwarded-Proto` to support reverse proxies and TLS terminators (Nginx, Caddy, Cloudflare, AWS ALB, Azure App Service).
2. SPA client-side fallback routing via `MapFallbackToFile("index.html")`.
3. Standalone container deployment via Docker Compose:

   ```bash
   docker compose up -d --build
   ```

## Repeatable Quality Gate

Run these commands from the solution root:

```text
dotnet build AleppoRealEstate.slnx --configuration Release
dotnet test AleppoRealEstate.slnx --configuration Release
cd src/Web/ClientApp
npm ci
npm run build -- --configuration production
npx ng test --watch=false
```

Automated verification matrix:
- **30/30** Backend Unit Tests passing.
- **115/115** Angular Frontend Unit Tests passing.
- **32/32** Master E2E Live HTTP Scenarios passing (`scratch/test_full_system_e2e.ps1`).

## Release, Rollback & Monitoring

1. Create a backup and record the currently deployed application version.
2. Apply the database migration step; deploy the container or coordinated artifacts.
3. Run staging/production smoke tests (`/api/health` and core user flows).
4. Roll back application artifacts if health or core scenarios fail.
5. Keep monitoring and backup/restore ownership explicit after launch.
