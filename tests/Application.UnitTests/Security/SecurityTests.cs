using Application.Common.Behaviors;
using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Common.Security;
using MediatR;
using Xunit;

namespace Application.UnitTests.Security;

public class SecurityTests
{
    private class FakeCurrentUserService : ICurrentUserService
    {
        public string? UserId { get; set; }
        public string? Role { get; set; }
        public Guid? AgencyId { get; set; }
        public List<string> UserPermissions { get; set; } = new();

        public IReadOnlyCollection<string> Permissions => UserPermissions;
        public bool HasPermission(string permission) => UserPermissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
        public bool IsInRole(string role) => string.Equals(Role, role, StringComparison.OrdinalIgnoreCase);
        public bool IsAuthenticated => !string.IsNullOrEmpty(UserId);
    }

    [Authorize(Policy = "Permission:Property.Create")]
    private record TestCreatePropertyCommand : IRequest<string>;

    [Authorize(Roles = "Admin,AgencyManager")]
    private record TestAdminOrManagerCommand : IRequest<string>;

    private record TestUnsecuredCommand : IRequest<string>;

    private record TestScopedAgencyCommand(Guid? AgencyId) : IRequest<string>, IAgencyScopedRequest;

    [Fact]
    public void PermissionRegistry_ShouldContainAllCorePermissions()
    {
        Assert.NotEmpty(PermissionRegistry.All);
        Assert.True(PermissionRegistry.IsValid(Permissions.Property.Create));
        Assert.True(PermissionRegistry.IsValid(Permissions.Property.Approve));
        Assert.True(PermissionRegistry.IsValid(Permissions.Property.GlobalAccess));
        Assert.True(PermissionRegistry.IsValid(Permissions.Agency.ManageAgents));
        Assert.False(PermissionRegistry.IsValid("Invalid.NonExistent.Permission"));
    }

    [Fact]
    public void DefaultRolePermissions_ShouldEnforceSeparationOfDuties()
    {
        var adminPerms = DefaultRolePermissions.GetPermissionsForRole("Admin");
        var managerPerms = DefaultRolePermissions.GetPermissionsForRole("AgencyManager");
        var agentPerms = DefaultRolePermissions.GetPermissionsForRole("Agent");
        var buyerPerms = DefaultRolePermissions.GetPermissionsForRole("Buyer");

        // Admin has global cross-agency access
        Assert.Contains(Permissions.Property.GlobalAccess, adminPerms);

        // AgencyManager has Approve, but Agent does NOT (Maker-Checker invariant)
        Assert.Contains(Permissions.Property.Approve, managerPerms);
        Assert.DoesNotContain(Permissions.Property.Approve, agentPerms);

        // Buyer cannot create or edit properties
        Assert.DoesNotContain(Permissions.Property.Create, buyerPerms);
        Assert.DoesNotContain(Permissions.Property.Edit, buyerPerms);
        Assert.Contains(Permissions.Property.View, buyerPerms);
    }

    [Fact]
    public async Task AuthorizationBehavior_ShouldAllowUnsecuredRequest_WithoutAuthentication()
    {
        var user = new FakeCurrentUserService { UserId = null };
        var behavior = new AuthorizationBehavior<TestUnsecuredCommand, string>(user);

        var result = await behavior.Handle(new TestUnsecuredCommand(), (ct) => Task.FromResult("OK"), CancellationToken.None);

        Assert.Equal("OK", result);
    }

    [Fact]
    public async Task AuthorizationBehavior_ShouldThrowUnauthorized_WhenUnauthenticatedUserAccessesSecuredRequest()
    {
        var user = new FakeCurrentUserService { UserId = null };
        var behavior = new AuthorizationBehavior<TestCreatePropertyCommand, string>(user);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            behavior.Handle(new TestCreatePropertyCommand(), (ct) => Task.FromResult("OK"), CancellationToken.None));
    }

    [Fact]
    public async Task AuthorizationBehavior_ShouldThrowForbidden_WhenUserLacksRequiredRole()
    {
        var user = new FakeCurrentUserService { UserId = Guid.NewGuid().ToString(), Role = "Buyer" };
        var behavior = new AuthorizationBehavior<TestAdminOrManagerCommand, string>(user);

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            behavior.Handle(new TestAdminOrManagerCommand(), (ct) => Task.FromResult("OK"), CancellationToken.None));
    }

    [Fact]
    public async Task AuthorizationBehavior_ShouldThrowForbidden_WhenUserLacksRequiredPermission()
    {
        var user = new FakeCurrentUserService
        {
            UserId = Guid.NewGuid().ToString(),
            Role = "Agent",
            UserPermissions = new List<string> { Permissions.Property.View } // Does not have Property.Create
        };
        var behavior = new AuthorizationBehavior<TestCreatePropertyCommand, string>(user);

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            behavior.Handle(new TestCreatePropertyCommand(), (ct) => Task.FromResult("OK"), CancellationToken.None));
    }

    [Fact]
    public async Task AuthorizationBehavior_ShouldProceed_WhenUserPossessesRequiredPermission()
    {
        var user = new FakeCurrentUserService
        {
            UserId = Guid.NewGuid().ToString(),
            Role = "Agent",
            UserPermissions = new List<string> { Permissions.Property.Create }
        };
        var behavior = new AuthorizationBehavior<TestCreatePropertyCommand, string>(user);

        var result = await behavior.Handle(new TestCreatePropertyCommand(), (ct) => Task.FromResult("SUCCESS"), CancellationToken.None);

        Assert.Equal("SUCCESS", result);
    }

    [Fact]
    public async Task AgencyScopeBehavior_ShouldAllow_WhenUserBelongsToSameAgency()
    {
        var agencyId = Guid.NewGuid();
        var user = new FakeCurrentUserService
        {
            UserId = Guid.NewGuid().ToString(),
            Role = "Agent",
            AgencyId = agencyId
        };
        var behavior = new AgencyScopeBehavior<TestScopedAgencyCommand, string>(user);

        var result = await behavior.Handle(new TestScopedAgencyCommand(agencyId), (ct) => Task.FromResult("SCOPED_OK"), CancellationToken.None);

        Assert.Equal("SCOPED_OK", result);
    }

    [Fact]
    public async Task AgencyScopeBehavior_ShouldThrowViolation_WhenTargetAgencyDiffers()
    {
        var userAgency = Guid.NewGuid();
        var foreignAgency = Guid.NewGuid();
        var user = new FakeCurrentUserService
        {
            UserId = Guid.NewGuid().ToString(),
            Role = "Agent",
            AgencyId = userAgency
        };
        var behavior = new AgencyScopeBehavior<TestScopedAgencyCommand, string>(user);

        var ex = await Assert.ThrowsAsync<AgencyScopeViolationException>(() =>
            behavior.Handle(new TestScopedAgencyCommand(foreignAgency), (ct) => Task.FromResult("SCOPED_OK"), CancellationToken.None));

        Assert.Contains("SEC-SCOPE-VIOLATION", ex.Message);
    }

    [Fact]
    public async Task AgencyScopeBehavior_ShouldAllow_WhenUserHasGlobalAccess()
    {
        var userAgency = Guid.NewGuid();
        var foreignAgency = Guid.NewGuid();
        var user = new FakeCurrentUserService
        {
            UserId = Guid.NewGuid().ToString(),
            Role = "Admin",
            AgencyId = userAgency,
            UserPermissions = new List<string> { Permissions.Property.GlobalAccess }
        };
        var behavior = new AgencyScopeBehavior<TestScopedAgencyCommand, string>(user);

        var result = await behavior.Handle(new TestScopedAgencyCommand(foreignAgency), (ct) => Task.FromResult("GLOBAL_OK"), CancellationToken.None);

        Assert.Equal("GLOBAL_OK", result);
    }
}
