using Application.Inquiries.Commands.CreateInquiry;
using Application.Inquiries.Commands.UpdateInquiryStatus;
using Application.Inquiries.Queries.GetReceivedInquiries;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Application.UnitTests.Inquiries;

public class InquiryTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateInquiryCommandHandler_ShouldCreateInquiryAndAtomicNotification()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var buyerId = Guid.NewGuid();

        var buyer = new User
        {
            Id = buyerId,
            FirstName = "طارق",
            LastName = "الحلبي",
            Email = "tarek@aleppo.com"
        };

        var prop = new Property
        {
            Id = Guid.NewGuid(),
            Title = "فيلا في حلب الجديدة",
            OwnerId = ownerId,
            Price = 1200000000m,
            Status = "Available",
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(buyer);
        context.Properties.Add(prop);
        await context.SaveChangesAsync();

        var handler = new CreateInquiryCommandHandler(context);
        var command = new CreateInquiryCommand
        {
            PropertyId = prop.Id,
            UserId = buyerId,
            PhoneNumber = "+963922222222",
            Message = "هل السعر قابل للتفاوض؟"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(prop.Id, result.PropertyId);
        Assert.Equal(buyerId, result.UserId);
        Assert.Equal("فيلا في حلب الجديدة", result.PropertyTitle);

        // Check Notification created atomically for owner
        var notification = await context.Notifications.FirstOrDefaultAsync(n => n.UserId == ownerId);
        Assert.NotNull(notification);
        Assert.Equal("InquiryReceived", notification.Type);
    }

    [Fact]
    public async Task UpdateInquiryStatusCommandHandler_ShouldUpdateStatusAndNotifyBuyer()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var buyerId = Guid.NewGuid();

        var buyer = new User
        {
            Id = buyerId,
            FirstName = "عمر",
            LastName = "الباشا",
            Email = "omar@aleppo.com"
        };

        var prop = new Property
        {
            Id = Guid.NewGuid(),
            Title = "مكتب في الجميلية",
            OwnerId = ownerId,
            Status = "Available"
        };

        var inquiry = new PropertyInquiry
        {
            Id = Guid.NewGuid(),
            PropertyId = prop.Id,
            Property = prop,
            UserId = buyerId,
            User = buyer,
            Status = "New",
            Message = "أرغب بمعاينة المكتب",
            PhoneNumber = "+963933333333"
        };

        context.Users.Add(buyer);
        context.Properties.Add(prop);
        context.PropertyInquiries.Add(inquiry);
        await context.SaveChangesAsync();

        var handler = new UpdateInquiryStatusCommandHandler(context);
        var command = new UpdateInquiryStatusCommand
        {
            InquiryId = inquiry.Id,
            Status = "Contacted",
            AgentNotes = "تم الاتصال بالعميل وتحديد موعد الأحد القادم",
            CurrentUserId = ownerId,
            IsAdmin = false
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(UpdateInquiryStatusResultStatus.Success, result.Status);
        Assert.NotNull(result.Data);
        Assert.Equal("Contacted", result.Data.Status);
        Assert.Equal("تم الاتصال بالعميل وتحديد موعد الأحد القادم", result.Data.AgentNotes);

        // Verify notification for buyer
        var buyerNotification = await context.Notifications.FirstOrDefaultAsync(n => n.UserId == buyerId.ToString());
        Assert.NotNull(buyerNotification);
        Assert.Equal("InquiryStatusUpdated", buyerNotification.Type);
    }

    [Fact]
    public async Task UpdateInquiryStatusCommandHandler_ShouldReturnForbidden_WhenNotOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var strangerId = Guid.NewGuid().ToString();
        var buyerId = Guid.NewGuid();

        var buyer = new User
        {
            Id = buyerId,
            FirstName = "مشتري",
            LastName = "تجريبي",
            Email = "buyer_test@aleppo.com"
        };

        var prop = new Property
        {
            Id = Guid.NewGuid(),
            Title = "محل في العبارة",
            OwnerId = ownerId
        };

        var inquiry = new PropertyInquiry
        {
            Id = Guid.NewGuid(),
            PropertyId = prop.Id,
            Property = prop,
            UserId = buyerId,
            User = buyer,
            Status = "New"
        };

        context.Users.Add(buyer);
        context.Properties.Add(prop);
        context.PropertyInquiries.Add(inquiry);
        await context.SaveChangesAsync();

        var handler = new UpdateInquiryStatusCommandHandler(context);
        var command = new UpdateInquiryStatusCommand
        {
            InquiryId = inquiry.Id,
            Status = "Contacted",
            CurrentUserId = strangerId,
            IsAdmin = false
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(UpdateInquiryStatusResultStatus.Forbidden, result.Status);
    }

    [Fact]
    public async Task GetReceivedInquiriesQueryHandler_ShouldReturnInquiriesForPropertyOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var otherOwnerId = Guid.NewGuid().ToString();

        var user1 = new User { Id = Guid.NewGuid(), FirstName = "سامر", LastName = "حلبي", Email = "samer@aleppo.com" };
        var user2 = new User { Id = Guid.NewGuid(), FirstName = "فادي", LastName = "شهباء", Email = "fadi@aleppo.com" };

        var prop1 = new Property { Id = Guid.NewGuid(), Title = "عقار للمالك 1", OwnerId = ownerId };
        var prop2 = new Property { Id = Guid.NewGuid(), Title = "عقار للمالك 2", OwnerId = otherOwnerId };

        var inq1 = new PropertyInquiry { Id = Guid.NewGuid(), PropertyId = prop1.Id, Property = prop1, UserId = user1.Id, User = user1, Status = "New" };
        var inq2 = new PropertyInquiry { Id = Guid.NewGuid(), PropertyId = prop2.Id, Property = prop2, UserId = user2.Id, User = user2, Status = "New" };

        context.Users.AddRange(user1, user2);
        context.Properties.AddRange(prop1, prop2);
        context.PropertyInquiries.AddRange(inq1, inq2);
        await context.SaveChangesAsync();

        var handler = new GetReceivedInquiriesQueryHandler(context);
        var query = new GetReceivedInquiriesQuery
        {
            OwnerUserId = ownerId,
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(inq1.Id, result.Items[0].Id);
    }
}
