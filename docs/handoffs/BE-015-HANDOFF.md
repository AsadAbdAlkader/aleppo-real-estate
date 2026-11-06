# BE-015 Handoff — Enterprise RBAC, MediatR Pipeline Behaviors, Dynamic Policies & Agency Scope

## 1. Overview
Implemented an Enterprise-Grade Role-Based and Permission-Based Access Control (RBAC) security architecture for the Aleppo Real Estate platform following Clean Architecture and MediatR Pipeline design patterns.

## 2. Changes Delivered
1. **Security Constants & Registry**:
   - `src/Application/Common/Security/Permissions.cs`: Categorized hierarchy of functional permissions (`Property`, `Inquiry`, `Agency`, `User`, `Chat`, `Dashboard`). Standard claim type is `"permission"`.
   - `src/Application/Common/Security/PermissionRegistry.cs`: Static runtime registry with reflection-based validation and lookup.
   - `src/Application/Common/Security/DefaultRolePermissions.cs`: Mapping of permissions for `Admin`, `AgencyManager`, `Agent`, `Owner`, and `Buyer` with strict Separation of Duties.
   - `src/Application/Common/Security/AuthorizeAttribute.cs`: MediatR request annotation supporting `Roles` and `Policy`.
   - `src/Application/Common/Security/IAgencyScopedRequest.cs`: Agency boundary marker interface.
2. **Security Exceptions**:
   - `src/Application/Common/Exceptions/ForbiddenAccessException.cs`: Thrown on permission/role denial.
   - `src/Application/Common/Exceptions/AgencyScopeViolationException.cs`: Thrown on agency isolation violations (`SEC-SCOPE-VIOLATION`).
3. **Pipeline Behaviors in MediatR**:
   - `src/Application/Common/Behaviors/AuthorizationBehavior.cs`: Enforces authentication, role checks, and dynamic policy checks (`Permission:...`).
   - `src/Application/Common/Behaviors/AgencyScopeBehavior.cs`: Enforces agency boundary isolation with global override for `Admin` / `Property.GlobalAccess`.
4. **Current User & Identity Context**:
   - `src/Application/Common/Interfaces/ICurrentUserService.cs`: Abstract user and permission context.
   - `src/Web/Services/CurrentUserService.cs`: Extracts `UserId`, `Role`, `AgencyId`, and effective `Permissions` from `IHttpContextAccessor`.
5. **Infrastructure Dynamic Policy Provider**:
   - `src/Infrastructure/Identity/PermissionPolicyProvider.cs`: Custom `IAuthorizationPolicyProvider` building policies dynamically on `Permission:` prefix.
   - `src/Infrastructure/Identity/PermissionAuthorizationHandler.cs`: Evaluates `PermissionRequirement` against user claims and role assignments.
6. **Token & DTO Enrichment**:
   - `JwtTokenGenerator`: Embeds `permission` claims and `agency_id` in generated JWTs.
   - `AuthResponseDto`: Returns `permissions: []` and `agencyId` on login and registration.
7. **Verification**:
   - `tests/Application.UnitTests/Security/SecurityTests.cs`: 10 comprehensive unit tests covering permission registry, role separation, authentication enforcement, policy rejection, permission success, and agency scoping.
   - Total backend tests: **40 / 40 passing**.
