using Application.Properties.Dtos;
using Application.Agents.Commands.UpdateAgentProfile;
using Application.Common.Behaviors;
using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Properties.Commands.CreateProperty;
using Application.Properties.Commands.DeleteProperty;
using Application.Properties.Commands.UpdateProperty;
using Application.Properties.Models;
using Application.Properties.Queries.GetProperties;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Web.Services;
using Xunit;

namespace Application.UnitTests.Security;

public class MultiTenantSecurityTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private class TestTenantContext : ITenantContext
    {
        public Guid? AgencyId { get; set; }
        public string? AgencyRole { get; set; }
        public bool IsActiveMember { get; set; }
        public bool IsPlatformAdmin { get; set; }

        public Task<bool> EnsureValidAgencyContextAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(IsActiveMember || IsPlatformAdmin);
        }

        public void SetManualContext(Guid agencyId, string agencyRole, bool isPlatformAdmin = false)
        {
            AgencyId = agencyId;
            AgencyRole = agencyRole;
            IsActiveMember = true;
            IsPlatformAdmin = isPlatformAdmin;
        }
    }

    // --------------------------------------------------------------------------------------------------
    // 1. Agency A cannot update Agency B properties
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario1_AgencyACannotUpdateAgencyBProperty()
    {
        using var context = CreateInMemoryDbContext();
        var agencyAId = Guid.NewGuid();
        var agencyBId = Guid.NewGuid();

        var propertyB = new Property
        {
            Id = Guid.NewGuid(),
            AgencyId = agencyBId,
            Title = "عقار تابع للمكتب ب",
            Price = 1000000m,
            Status = "Available"
        };
        context.Properties.Add(propertyB);
        await context.SaveChangesAsync();

        var tenantContextA = new TestTenantContext
        {
            AgencyId = agencyAId,
            AgencyRole = "Owner",
            IsActiveMember = true
        };

        var handler = new UpdatePropertyCommandHandler(context, tenantContextA);
        var command = new UpdatePropertyCommand
        {
            Id = propertyB.Id,
            Title = "محاولة تعديل غير مصرح بها",
            Price = 2000000m,
            CurrentUserId = Guid.NewGuid().ToString()
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(PropertyCommandStatus.Forbidden, result.Status);
        Assert.Contains("SEC-FORBIDDEN-AGENCY", result.ErrorMessage);

        // Verify property unchanged in DB
        var unchangedProp = await context.Properties.AsNoTracking().FirstAsync(p => p.Id == propertyB.Id);
        Assert.Equal("عقار تابع للمكتب ب", unchangedProp.Title);
        Assert.Equal(1000000m, unchangedProp.Price);
    }

    // --------------------------------------------------------------------------------------------------
    // 2. Agency A cannot delete Agency B properties
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario2_AgencyACannotDeleteAgencyBProperty()
    {
        using var context = CreateInMemoryDbContext();
        var agencyAId = Guid.NewGuid();
        var agencyBId = Guid.NewGuid();

        var propertyB = new Property
        {
            Id = Guid.NewGuid(),
            AgencyId = agencyBId,
            Title = "عقار مكتب ب المحمي",
            Price = 5000000m,
            Status = "Available"
        };
        context.Properties.Add(propertyB);
        await context.SaveChangesAsync();

        var tenantContextA = new TestTenantContext
        {
            AgencyId = agencyAId,
            AgencyRole = "Owner",
            IsActiveMember = true
        };

        var handler = new DeletePropertyCommandHandler(context, tenantContextA);
        var command = new DeletePropertyCommand(propertyB.Id, Guid.NewGuid().ToString(), IsAdmin: false);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(PropertyCommandStatus.Forbidden, result.Status);
        Assert.Contains("SEC-FORBIDDEN-AGENCY", result.ErrorMessage);

        // Verify property still exists in DB
        var exists = await context.Properties.AnyAsync(p => p.Id == propertyB.Id);
        Assert.True(exists);
    }

    // --------------------------------------------------------------------------------------------------
    // 3. An unassociated user cannot create properties in an agency
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario3_UnassociatedUserCannotCreateProperties()
    {
        using var context = CreateInMemoryDbContext();
        var tenantContext = new TestTenantContext
        {
            AgencyId = null,
            IsActiveMember = false
        };

        var handler = new CreatePropertyCommandHandler(context, tenantContext);
        var command = new CreatePropertyCommand
        {
            Title = "عقار بدون عضوية مكتب",
            Price = 1200000m,
            OwnerId = Guid.NewGuid().ToString()
        };

        var ex = await Assert.ThrowsAsync<AgencyScopeViolationException>(() =>
            handler.Handle(command, CancellationToken.None));

        Assert.Contains("SEC-SCOPE-VIOLATION", ex.Message);
        Assert.Empty(context.Properties);
    }

    // --------------------------------------------------------------------------------------------------
    // 4. An Agent cannot elevate themselves to Owner or update unauthorized agency profiles
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario4_AgentCannotElevateToOwnerOrSelfAssignToAgency()
    {
        using var context = CreateInMemoryDbContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "agent@aleppo.com",
            FirstName = "أحمد",
            LastName = "الحلبي"
        };
        var targetAgency = new Agency
        {
            Id = Guid.NewGuid(),
            Name = "مكتب الشهباء العقاري",
            Slug = "al-shahba"
        };
        context.Users.Add(user);
        context.Agencies.Add(targetAgency);
        await context.SaveChangesAsync();

        // User is NOT an active member of targetAgency
        var handler = new UpdateAgentProfileCommandHandler(context);
        var command = new UpdateAgentProfileCommand
        {
            CurrentUserId = user.Id.ToString(),
            UserRole = "Agent",
            Bio = "محاولة الانضمام لمكتب بدون دعوة",
            AgencyId = targetAgency.Id
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(AgentProfileCommandStatus.Forbidden, result.Status);
        Assert.Contains("SEC-FORBIDDEN-MEMBERSHIP", result.ErrorMessage);
    }

    // --------------------------------------------------------------------------------------------------
    // 5. Changing X-Agency-Id cannot bypass membership checks
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario5_ChangingXAgencyIdCannotBypassMembershipChecks()
    {
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var legitimateAgencyId = Guid.NewGuid();
        var spoofedAgencyId = Guid.NewGuid();

        // User only has membership in legitimateAgencyId
        context.AgencyMembers.Add(new AgencyMember
        {
            Id = Guid.NewGuid(),
            AgencyId = legitimateAgencyId,
            UserId = userId,
            Role = "Agent",
            MembershipStatus = "Active"
        });
        await context.SaveChangesAsync();

        // Create HttpContext with spoofed header X-Agency-Id = spoofedAgencyId
        var httpContext = new DefaultHttpContext();
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, "Agent")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        httpContext.User = new ClaimsPrincipal(identity);
        httpContext.Request.Headers["X-Agency-Id"] = spoofedAgencyId.ToString();

        var httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        var tenantContext = new TenantContext(httpContextAccessorMock.Object, context);

        // Act
        var isValid = await tenantContext.EnsureValidAgencyContextAsync();

        // Assert: Fail Closed!
        Assert.False(isValid);
        Assert.False(tenantContext.IsActiveMember);
        Assert.Null(tenantContext.AgencyId);
    }

    [Fact]
    public async Task Scenario5b_AgencyScopeBehavior_ThrowsWhenTenantContextInvalid()
    {
        var tenantContext = new TestTenantContext
        {
            AgencyId = null,
            IsActiveMember = false,
            IsPlatformAdmin = false
        };

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(s => s.IsInRole(It.IsAny<string>())).Returns(false);
        currentUserServiceMock.Setup(s => s.HasPermission(It.IsAny<string>())).Returns(false);

        var behavior = new AgencyScopeBehavior<CreatePropertyCommand, PropertyDto>(tenantContext, currentUserServiceMock.Object);
        var command = new CreatePropertyCommand { Title = "عقار تجريبي" };

        var ex = await Assert.ThrowsAsync<AgencyScopeViolationException>(() =>
            behavior.Handle(command, (ct) => Task.FromResult(new Application.Properties.Dtos.PropertyDto()), CancellationToken.None));

        Assert.Contains("SEC-SCOPE-VIOLATION", ex.Message);
    }

    // --------------------------------------------------------------------------------------------------
    // 6. Public queries never return Draft, PendingReview, Reserved, or Archived properties
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario6_PublicQueriesNeverReturnNonPublicProperties()
    {
        using var context = CreateInMemoryDbContext();
        var agency = new Agency { Id = Guid.NewGuid(), Name = "وكالة الميدان", Slug = "al-midan" };
        context.Agencies.Add(agency);

        var availableProp = new Property { Id = Guid.NewGuid(), AgencyId = agency.Id, Title = "متاح", Status = "Available" };
        var publishedProp = new Property { Id = Guid.NewGuid(), AgencyId = agency.Id, Title = "منشور", Status = "Published" };
        var draftProp = new Property { Id = Guid.NewGuid(), AgencyId = agency.Id, Title = "مسودة سرية", Status = "Draft" };
        var pendingProp = new Property { Id = Guid.NewGuid(), AgencyId = agency.Id, Title = "قيد المراجعة", Status = "PendingReview" };
        var reservedProp = new Property { Id = Guid.NewGuid(), AgencyId = agency.Id, Title = "محجوز", Status = "Reserved" };
        var archivedProp = new Property { Id = Guid.NewGuid(), AgencyId = agency.Id, Title = "مؤرشف", Status = "Archived" };

        context.Properties.AddRange(availableProp, publishedProp, draftProp, pendingProp, reservedProp, archivedProp);
        await context.SaveChangesAsync();

        var handler = new GetPropertiesQueryHandler(context);

        // 1. Default public query
        var defaultQuery = new GetPropertiesQuery();
        var defaultResult = await handler.Handle(defaultQuery, CancellationToken.None);

        Assert.Equal(2, defaultResult.Items.Count);
        Assert.Contains(defaultResult.Items, p => p.Title == "متاح");
        Assert.Contains(defaultResult.Items, p => p.Title == "منشور");
        Assert.DoesNotContain(defaultResult.Items, p => p.Title == "مسودة سرية");
        Assert.DoesNotContain(defaultResult.Items, p => p.Title == "قيد المراجعة");

        // 2. Explicit attempt to query Draft status publicly
        var draftQuery = new GetPropertiesQuery { Status = "Draft" };
        var draftResult = await handler.Handle(draftQuery, CancellationToken.None);
        Assert.Empty(draftResult.Items);

        // 3. Explicit attempt to query PendingReview status publicly
        var pendingQuery = new GetPropertiesQuery { Status = "PendingReview" };
        var pendingResult = await handler.Handle(pendingQuery, CancellationToken.None);
        Assert.Empty(pendingResult.Items);
    }

    // --------------------------------------------------------------------------------------------------
    // 7. An authorized agency Owner can manage properties created by other members of their agency
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario7_AgencyOwnerCanManageOtherMembersPropertiesWithinAgency()
    {
        using var context = CreateInMemoryDbContext();
        var agencyId = Guid.NewGuid();
        var agentUserId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        var property = new Property
        {
            Id = Guid.NewGuid(),
            AgencyId = agencyId,
            CreatedByUserId = agentUserId,
            OwnerId = agentUserId.ToString(),
            Title = "شقة أنشأها الوكيل",
            Price = 3000000m,
            Status = "Available"
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        // Owner operating under the agency context
        var ownerContext = new TestTenantContext
        {
            AgencyId = agencyId,
            AgencyRole = "Owner",
            IsActiveMember = true
        };

        // Act 1: Owner updates Agent's property
        var updateHandler = new UpdatePropertyCommandHandler(context, ownerContext);
        var updateCommand = new UpdatePropertyCommand
        {
            Id = property.Id,
            Title = "شقة معدلة بواسطة مدير المكتب",
            Price = 3200000m,
            CurrentUserId = ownerUserId.ToString()
        };
        var updateResult = await updateHandler.Handle(updateCommand, CancellationToken.None);
        Assert.Equal(PropertyCommandStatus.Success, updateResult.Status);
        Assert.Equal("شقة معدلة بواسطة مدير المكتب", updateResult.Property!.Title);

        // Act 2: Owner deletes Agent's property
        var deleteHandler = new DeletePropertyCommandHandler(context, ownerContext);
        var deleteCommand = new DeletePropertyCommand(property.Id, ownerUserId.ToString(), IsAdmin: false);
        var deleteResult = await deleteHandler.Handle(deleteCommand, CancellationToken.None);
        Assert.Equal(PropertyCommandStatus.Success, deleteResult.Status);

        Assert.Empty(context.Properties);
    }

    // --------------------------------------------------------------------------------------------------
    // 8. A user belonging to two agencies can access each only through validated membership
    // --------------------------------------------------------------------------------------------------
    [Fact]
    public async Task Scenario8_MultiAgencyUserCanAccessEachOnlyThroughValidatedContext()
    {
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var agency1Id = Guid.NewGuid();
        var agency2Id = Guid.NewGuid();

        // Property in Agency 1 (created by another member)
        var propAgency1 = new Property
        {
            Id = Guid.NewGuid(),
            AgencyId = agency1Id,
            CreatedByUserId = Guid.NewGuid(),
            Title = "عقار مكتب 1",
            Price = 1000000m,
            Status = "Available"
        };

        // Property in Agency 2 (created by another member)
        var propAgency2 = new Property
        {
            Id = Guid.NewGuid(),
            AgencyId = agency2Id,
            CreatedByUserId = Guid.NewGuid(),
            Title = "عقار مكتب 2",
            Price = 2000000m,
            Status = "Available"
        };

        context.Properties.AddRange(propAgency1, propAgency2);
        await context.SaveChangesAsync();

        // Context 1: User acting under Agency 1 as "Agent"
        var context1 = new TestTenantContext
        {
            AgencyId = agency1Id,
            AgencyRole = "Agent",
            IsActiveMember = true
        };

        // Under Agency 1 context, Agent cannot edit other member's property in Agency 1
        var updateHandler1 = new UpdatePropertyCommandHandler(context, context1);
        var updateResult1 = await updateHandler1.Handle(new UpdatePropertyCommand
        {
            Id = propAgency1.Id,
            Title = "تعديل غير مسموح",
            CurrentUserId = userId.ToString()
        }, CancellationToken.None);
        Assert.Equal(PropertyCommandStatus.Forbidden, updateResult1.Status);
        Assert.Contains("SEC-FORBIDDEN-AGENT", updateResult1.ErrorMessage);

        // Under Agency 1 context, user cannot touch Agency 2 property (cross-tenant)
        var crossResult = await updateHandler1.Handle(new UpdatePropertyCommand
        {
            Id = propAgency2.Id,
            Title = "اختراق عابر للمكاتب",
            CurrentUserId = userId.ToString()
        }, CancellationToken.None);
        Assert.Equal(PropertyCommandStatus.Forbidden, crossResult.Status);
        Assert.Contains("SEC-FORBIDDEN-AGENCY", crossResult.ErrorMessage);

        // Context 2: User switches to Agency 2 where they hold the "Owner" role
        var context2 = new TestTenantContext
        {
            AgencyId = agency2Id,
            AgencyRole = "Owner",
            IsActiveMember = true
        };

        var updateHandler2 = new UpdatePropertyCommandHandler(context, context2);

        // As Owner of Agency 2, they CAN update Agency 2 property
        var validUpdate2 = await updateHandler2.Handle(new UpdatePropertyCommand
        {
            Id = propAgency2.Id,
            Title = "تم التعديل كمدير للمكتب 2",
            Price = 2500000m,
            CurrentUserId = userId.ToString()
        }, CancellationToken.None);
        Assert.Equal(PropertyCommandStatus.Success, validUpdate2.Status);
        Assert.Equal("تم التعديل كمدير للمكتب 2", validUpdate2.Property!.Title);

        // But under Agency 2 context, they cannot touch Agency 1 property
        var crossResult2 = await updateHandler2.Handle(new UpdatePropertyCommand
        {
            Id = propAgency1.Id,
            Title = "محاولة تعديل عقار مكتب 1 من سياق مكتب 2",
            CurrentUserId = userId.ToString()
        }, CancellationToken.None);
        Assert.Equal(PropertyCommandStatus.Forbidden, crossResult2.Status);
        Assert.Contains("SEC-FORBIDDEN-AGENCY", crossResult2.ErrorMessage);
    }
}
