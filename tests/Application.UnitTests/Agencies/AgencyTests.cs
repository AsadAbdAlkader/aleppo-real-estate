using Application.Agencies.Commands.CreateAgency;
using Application.Agencies.Commands.UpdateAgency;
using Application.Agencies.Queries.GetAgencies;
using Application.Agencies.Queries.GetAgencyById;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Application.UnitTests.Agencies;

public class AgencyTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateAgencyCommandHandler_ShouldCreateAgency_WhenUserIsAgentOrAdmin()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new CreateAgencyCommandHandler(context);
        var command = new CreateAgencyCommand
        {
            Name = "مكتب الشهباء العقاري",
            Description = "أفضل المكاتب العقارية في حلب",
            CityArea = "الفرقان",
            PhoneNumber = "+963212222222",
            UserRole = "Agent"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(CreateAgencyStatus.Success, result.Status);
        Assert.NotNull(result.Data);
        Assert.Equal("مكتب الشهباء العقاري", result.Data.Name);
        Assert.Equal("الفرقان", result.Data.CityArea);

        var agencyInDb = await context.Agencies.FirstOrDefaultAsync(a => a.Id == result.Data.Id);
        Assert.NotNull(agencyInDb);
    }

    [Fact]
    public async Task CreateAgencyCommandHandler_ShouldReturnForbidden_WhenUserIsBuyer()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new CreateAgencyCommandHandler(context);
        var command = new CreateAgencyCommand
        {
            Name = "مكتب غير مصرح",
            UserRole = "Buyer"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(CreateAgencyStatus.Forbidden, result.Status);
    }

    [Fact]
    public async Task UpdateAgencyCommandHandler_ShouldReturnNotFound_WhenAgencyDoesNotExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new UpdateAgencyCommandHandler(context);
        var command = new UpdateAgencyCommand
        {
            AgencyId = Guid.NewGuid(),
            Name = "مكتب معدل",
            UserRole = "Agent"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(UpdateAgencyStatus.NotFound, result.Status);
    }

    [Fact]
    public async Task UpdateAgencyCommandHandler_ShouldReturnForbidden_WhenUserIsBuyer()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var agency = new Agency
        {
            Id = Guid.NewGuid(),
            Name = "مكتب الوفاء",
            CreatedAt = DateTime.UtcNow
        };
        context.Agencies.Add(agency);
        await context.SaveChangesAsync();

        var handler = new UpdateAgencyCommandHandler(context);
        var command = new UpdateAgencyCommand
        {
            AgencyId = agency.Id,
            Name = "اسم جديد",
            UserRole = "Buyer"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(UpdateAgencyStatus.Forbidden, result.Status);
    }

    [Fact]
    public async Task GetAgencyByIdQueryHandler_ShouldReturnDetails_WhenAgencyExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var agency = new Agency
        {
            Id = Guid.NewGuid(),
            Name = "مكتب النصر",
            CityArea = "الميدان",
            PhoneNumber = "+963215555555",
            CreatedAt = DateTime.UtcNow
        };
        context.Agencies.Add(agency);
        await context.SaveChangesAsync();

        var handler = new GetAgencyByIdQueryHandler(context);
        var query = new GetAgencyByIdQuery(agency.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("مكتب النصر", result.Name);
        Assert.Equal("الميدان", result.CityArea);
    }
}
