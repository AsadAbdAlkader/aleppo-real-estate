using Application.Tours.Commands.BookTour;
using Application.Tours.Queries.GetMyTours;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Application.UnitTests.Tours;

public class TourBookingTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task BookPropertyTour_ShouldCreateBookingAndNotification_WhenValid()
    {
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Title = "فيلا فاخرة بحلب الجديدة",
            OwnerId = ownerId,
            Price = 450000,
            Status = "Available",
            CityArea = "حلب الجديدة",
            Address = "شارع الأندلس"
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var handler = new BookTourCommandHandler(context);
        var command = new BookTourCommand
        {
            PropertyId = property.Id,
            BuyerId = Guid.NewGuid().ToString(),
            BuyerName = "طارق المستثمر",
            BuyerPhone = "+963944111222",
            TourDate = DateTime.UtcNow.AddDays(2),
            TourType = "VideoCall",
            Notes = "معاينة عن بعد عبر تطبيق زووم للمغتربين"
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("VideoCall", result.TourType);
        Assert.Equal("Pending", result.Status);
        Assert.Equal(property.Title, result.PropertyTitle);

        var notification = await context.Notifications.FirstOrDefaultAsync(n => n.UserId == ownerId);
        Assert.NotNull(notification);
        Assert.Equal("TourBooking", notification.Type);
        Assert.Contains("طارق المستثمر", notification.Message);
    }

    [Fact]
    public async Task BookPropertyTour_ShouldThrow_WhenPropertyNotFound()
    {
        using var context = CreateInMemoryDbContext();
        var handler = new BookTourCommandHandler(context);
        var command = new BookTourCommand
        {
            PropertyId = Guid.NewGuid(),
            BuyerId = "buyer-123",
            BuyerName = "مشتري",
            BuyerPhone = "+963911000111",
            TourDate = DateTime.UtcNow.AddDays(1)
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task GetMyTours_ShouldReturnUserBookings()
    {
        using var context = CreateInMemoryDbContext();
        var buyerId = Guid.NewGuid().ToString();
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Title = "شقة بالسبيل",
            Price = 120000,
            Status = "Available"
        };
        context.Properties.Add(property);

        var booking = new PropertyTourBooking
        {
            Id = Guid.NewGuid(),
            PropertyId = property.Id,
            BuyerId = buyerId,
            BuyerName = "طارق",
            BuyerPhone = "0944111222",
            TourDate = DateTime.UtcNow.AddDays(3),
            Status = "Confirmed"
        };
        context.PropertyTourBookings.Add(booking);
        await context.SaveChangesAsync();

        var handler = new GetMyToursQueryHandler(context);
        var result = await handler.Handle(new GetMyToursQuery { UserId = buyerId }, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(property.Title, result[0].PropertyTitle);
    }
}
