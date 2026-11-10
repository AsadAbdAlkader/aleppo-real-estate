using System.Security.Claims;
using Application.Common.Interfaces;
using Application.Common.Security;
using Microsoft.AspNetCore.Http;

namespace Web.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenantContext _tenantContext;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, ITenantContext tenantContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenantContext = tenantContext;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User?.FindFirstValue("sub");

    public string? Role => _tenantContext.AgencyRole
        ?? User?.FindFirstValue(ClaimTypes.Role)
        ?? User?.FindFirstValue("role");

    public Guid? AgencyId => _tenantContext.AgencyId ?? ParseClaimAgencyId();

    private Guid? ParseClaimAgencyId()
    {
        var agencyClaim = User?.FindFirstValue("agency_id");
        if (!string.IsNullOrEmpty(agencyClaim) && Guid.TryParse(agencyClaim, out var id))
        {
            return id;
        }
        return null;
    }

    public IReadOnlyCollection<string> Permissions
    {
        get
        {
            if (User == null) return Array.Empty<string>();

            var explicitClaims = User.FindAll(Application.Common.Security.Permissions.ClaimType).Select(c => c.Value);
            var role = Role;
            var rolePerms = !string.IsNullOrEmpty(role)
                ? DefaultRolePermissions.GetPermissionsForRole(role)
                : Array.Empty<string>();

            return explicitClaims.Concat(rolePerms).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        }
    }

    public bool HasPermission(string permission)
    {
        if (string.IsNullOrWhiteSpace(permission)) return false;
        return Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
    }

    public bool IsInRole(string role)
    {
        if (string.IsNullOrWhiteSpace(role) || User == null) return false;
        return string.Equals(Role, role, StringComparison.OrdinalIgnoreCase) || User.IsInRole(role);
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
