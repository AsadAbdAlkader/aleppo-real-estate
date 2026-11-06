using System.Security.Claims;
using Application.Common.Security;
using Microsoft.AspNetCore.Authorization;

namespace Infrastructure.Identity;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User == null)
        {
            return Task.CompletedTask;
        }

        // 1. Check direct 'permission' claims
        var hasPermissionClaim = context.User.Claims.Any(c =>
            string.Equals(c.Type, Permissions.ClaimType, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));

        if (hasPermissionClaim)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 2. Check role-derived permissions based on DefaultRolePermissions
        var userRoles = context.User.FindAll(ClaimTypes.Role)
            .Concat(context.User.FindAll("role"))
            .Select(c => c.Value);

        var effectivePermissions = DefaultRolePermissions.GetEffectivePermissions(userRoles);
        if (effectivePermissions.Contains(requirement.Permission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}
