# Backend Handoff — BE-FIX-002: Remove OwnerEmail Privacy Field & Verify Single SQL Query Projection

## Overview
- **Task ID:** BE-FIX-002
- **Feature:** Remove `OwnerEmail` privacy field & verify single SQL query projection in `GetPropertyByIdQuery`.
- **Developer:** SUB-AGENT 1 (ASP.NET Core Senior)
- **Target Framework:** .NET 9 / ASP.NET Core Web API / EF Core 9

---

## Key Changes Implemented

### 1. DTO Privacy Refinement (`src/Application/Properties/Dtos/PropertyDto.cs`)
- Removed `public string? OwnerEmail { get; set; }` from `PropertyDto.cs`.
- Ensures user email addresses are kept strictly private across all property endpoint responses.

### 2. CQRS Query & Single SQL Query Projection (`src/Application/Properties/Queries/GetPropertyById/GetPropertyByIdQuery.cs`)
- Updated `GetPropertyByIdQueryHandler`:
  - Uses `.AsNoTracking()` and EF Core direct `.Select()` projection directly onto `PropertyDto`.
  - Omits `OwnerEmail` projection.
  - Ensures EF Core generates a single optimized SQL query (with LEFT JOIN on `AspNetUsers`) without N+1 query overhead.
  - Preserved Archived status guard: returns `null` (yielding HTTP `404 Not Found`) if property is missing OR if `property.Status.Equals("Archived", StringComparison.OrdinalIgnoreCase)`.

### 3. Application Projections & Command Handlers
- Removed `OwnerEmail` assignments across:
  - `src/Application/Properties/Queries/GetProperties/GetPropertiesQuery.cs`
  - `src/Application/Properties/Queries/GetMyProperties/GetMyPropertiesQuery.cs`
  - `src/Application/Favorites/Queries/GetUserFavorites/GetUserFavoritesQuery.cs`
  - `src/Application/Properties/Commands/CreateProperty/CreatePropertyCommand.cs`
  - `src/Application/Properties/Commands/UpdateProperty/UpdatePropertyCommand.cs`

### 4. API Contract Documentation (`docs/api-contract.md`)
- Updated `docs/api-contract.md` to remove `ownerEmail` field from property response JSON schemas.

---

## Empirical Verification & Live HTTP Results

1. **Solution Compilation (`dotnet build`)**:
   - `dotnet build` succeeded with **0 Warnings** and **0 Errors**.

2. **Live HTTP Endpoint Testing (`GET /api/properties/{id}`)**:
   - Running live Web API on `http://localhost:5215`.
   - **GET `/api/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6`**:
     - Status: **`200 OK`**
     - Verified response JSON structure:
       - `ownerId`: `"3fa85f64-5717-4562-b3fc-2c963f66b111"`
       - `ownerName`: `"أحمد الحلبي"`
       - **NO `ownerEmail` / `OwnerEmail`** field present.
       - **NO passwords, password hashes, or JWT tokens** present.
   - **GET `/api/properties/8e567f64-5717-4562-b3fc-2c963f66ffe1`** (Archived property):
     - Status: **`404 Not Found`** as expected.
   - **GET `/api/properties/00000000-0000-0000-0000-000000000000`** (Non-existent property):
     - Status: **`404 Not Found`** as expected.
