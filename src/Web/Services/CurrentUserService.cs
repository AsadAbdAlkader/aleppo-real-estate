using System.Security.Claims;
using Application.Common.Interfaces;
using Application.Common.Security;
using Microsoft.AspNetCore.Http;

namespace Web.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier) 
        ?? User?.FindFirstValue("sub");

    public string? Role => User?.FindFirstValue(ClaimTypes.Role) 
        ?? User?.FindFirstValue("role");

    public Guid? AgencyId
    {
        get
        {
            var agencyClaim = User?.FindFirstValue("agency_id");
            if (!string.IsNullOrEmpty(agencyClaim) && Guid.TryParse(agencyClaim, out var id))
            {
                return id;
            }
            return null;
        }
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
        return User.IsInRole(role) || string.Equals(Role, role, StringComparison.OrdinalIgnoreCase);
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
