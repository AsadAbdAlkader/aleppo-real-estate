using Application.Common.Interfaces;
using Application.Properties.Commands.CreateProperty;
using Application.Properties.Commands.DeleteProperty;
using Application.Properties.Commands.UpdateProperty;
using Application.Properties.Models;
using Application.Properties.Queries.GetProperties;
using Application.Properties.Queries.GetPropertyById;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Application.UnitTests.Properties;

public class PropertyTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreatePropertyCommandHandler_ShouldCreatePropertyAndReturnDto()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new CreatePropertyCommandHandler(context);
        var command = new CreatePropertyCommand
        {
            Title = "شقة فخمة في الميريديان",
            Description = "إطلالة بانورامية رائعة",
            Price = 450000000m,
            Category = "Apartment",
            Purpose = "Sale",
            City = "حلب",
            CityArea = "الميريديان",
            Address = "شارع الفنادق",
            Bedrooms = 3,
            Bathrooms = 2,
            AreaSquareMeters = 160,
            OwnerId = Guid.NewGuid().ToString()
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("شقة فخمة في الميريديان", result.Title);
        Assert.Equal(450000000m, result.Price);
        Assert.Equal("الميريديان", result.CityArea);

        var propertyInDb = await context.Properties.FirstOrDefaultAsync(p => p.Id == result.Id);
        Assert.NotNull(propertyInDb);
        Assert.Equal(command.OwnerId, propertyInDb.OwnerId);
    }

    [Fact]
    public async Task GetPropertiesQueryHandler_ShouldFilterByAreaAndPrice()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var prop1 = new Property
        {
            Id = Guid.NewGuid(),
            Title = "شقة في الشهباء",
            City = "حلب",
            CityArea = "الشهباء الجديدة",
            Category = "Apartment",
            Purpose = "Sale",
            Price = 600000000m,
            Status = "Available",
            AreaSquareMeters = 180,
            CreatedAt = DateTime.UtcNow
        };

        var prop2 = new Property
        {
            Id = Guid.NewGuid(),
            Title = "مكتب تجاري في الفرقان",
            City = "حلب",
            CityArea = "الفرقان",
            Category = "Office",
            Purpose = "Rent",
            Price = 2500000m,
            Status = "Available",
            AreaSquareMeters = 80,
            CreatedAt = DateTime.UtcNow
        };

        context.Properties.AddRange(prop1, prop2);
        await context.SaveChangesAsync();

        var handler = new GetPropertiesQueryHandler(context);
        var query = new GetPropertiesQuery
        {
            CityArea = "الشهباء الجديدة",
            Category = "Apartment"
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal("شقة في الشهباء", result.Items[0].Title);
    }

    [Fact]
    public async Task GetPropertyByIdQueryHandler_ShouldReturnNull_WhenNotFound()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new GetPropertyByIdQueryHandler(context);
        var query = new GetPropertyByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeletePropertyCommandHandler_ShouldAllowOwnerToDelete()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var prop = new Property
        {
            Id = Guid.NewGuid(),
            Title = "شقة للبيع",
            OwnerId = ownerId,
            Price = 200000000m,
            Status = "Available",
            CreatedAt = DateTime.UtcNow
        };
        context.Properties.Add(prop);
        await context.SaveChangesAsync();

        var handler = new DeletePropertyCommandHandler(context);
        var command = new DeletePropertyCommand(prop.Id, ownerId, IsAdmin: false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(PropertyCommandStatus.Success, result.Status);
        Assert.Null(await context.Properties.FirstOrDefaultAsync(p => p.Id == prop.Id));
    }

    [Fact]
    public async Task DeletePropertyCommandHandler_ShouldReturnForbidden_WhenNotOwnerOrAdmin()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var strangerId = Guid.NewGuid().ToString();
        var prop = new Property
        {
            Id = Guid.NewGuid(),
            Title = "شقة للبيع",
            OwnerId = ownerId,
            Price = 200000000m,
            Status = "Available",
            CreatedAt = DateTime.UtcNow
        };
        context.Properties.Add(prop);
        await context.SaveChangesAsync();

        var handler = new DeletePropertyCommandHandler(context);
        var command = new DeletePropertyCommand(prop.Id, strangerId, IsAdmin: false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(PropertyCommandStatus.Forbidden, result.Status);
        Assert.NotNull(await context.Properties.FirstOrDefaultAsync(p => p.Id == prop.Id));
    }

    [Fact]
    public async Task UpdatePropertyCommandHandler_ShouldReturnForbidden_WhenNotOwnerOrAdmin()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var strangerId = Guid.NewGuid().ToString();
        var prop = new Property
        {
            Id = Guid.NewGuid(),
            Title = "شقة قديمة",
            OwnerId = ownerId,
            Price = 100000000m,
            Status = "Available",
            CreatedAt = DateTime.UtcNow
        };
        context.Properties.Add(prop);
        await context.SaveChangesAsync();

        var handler = new UpdatePropertyCommandHandler(context);
        var command = new UpdatePropertyCommand
        {
            Id = prop.Id,
            Title = "محاولة تعديل غير مصرحة",
            CurrentUserId = strangerId,
            IsAdmin = false
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(PropertyCommandStatus.Forbidden, result.Status);
    }
}
