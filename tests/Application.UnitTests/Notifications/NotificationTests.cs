using Application.Notifications.Commands.MarkAllNotificationsAsRead;
using Application.Notifications.Commands.MarkNotificationAsRead;
using Application.Notifications.Queries.GetNotifications;
using Application.Notifications.Queries.GetUnreadNotificationsCount;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Application.UnitTests.Notifications;

public class NotificationTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetUnreadNotificationsCountQueryHandler_ShouldReturnCorrectCount()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid().ToString();

        context.Notifications.AddRange(
            new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false, Title = "تنبيه 1", Message = "رسالة 1", CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false, Title = "تنبيه 2", Message = "رسالة 2", CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = true, Title = "تنبيه 3", Message = "رسالة 3", CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = "other-user", IsRead = false, Title = "تنبيه آخر", Message = "رسالة أخرى", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var handler = new GetUnreadNotificationsCountQueryHandler(context);
        var query = new GetUnreadNotificationsCountQuery(userId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.UnreadCount);
    }

    [Fact]
    public async Task MarkNotificationAsReadCommandHandler_ShouldMarkAsRead_WhenOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid().ToString();
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            IsRead = false,
            Title = "إشعار",
            Message = "نص الإشعار",
            CreatedAt = DateTime.UtcNow
        };
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        var handler = new MarkNotificationAsReadCommandHandler(context);
        var command = new MarkNotificationAsReadCommand(notification.Id, userId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var inDb = await context.Notifications.FirstOrDefaultAsync(n => n.Id == notification.Id);
        Assert.NotNull(inDb);
        Assert.True(inDb.IsRead);
    }

    [Fact]
    public async Task MarkNotificationAsReadCommandHandler_ShouldReturnFalse_WhenNotOwner()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid().ToString();
        var strangerId = Guid.NewGuid().ToString();
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = ownerId,
            IsRead = false,
            Title = "إشعار",
            Message = "نص الإشعار",
            CreatedAt = DateTime.UtcNow
        };
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        var handler = new MarkNotificationAsReadCommandHandler(context);
        var command = new MarkNotificationAsReadCommand(notification.Id, strangerId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
        var inDb = await context.Notifications.FirstOrDefaultAsync(n => n.Id == notification.Id);
        Assert.NotNull(inDb);
        Assert.False(inDb.IsRead);
    }

    [Fact]
    public async Task MarkAllNotificationsAsReadCommandHandler_ShouldMarkAllUserNotifications()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid().ToString();

        context.Notifications.AddRange(
            new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false, Title = "1", Message = "1", CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false, Title = "2", Message = "2", CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = "other", IsRead = false, Title = "3", Message = "3", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var handler = new MarkAllNotificationsAsReadCommandHandler(context);
        var command = new MarkAllNotificationsAsReadCommand(userId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        var unreadUserCount = await context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
        var unreadOtherCount = await context.Notifications.CountAsync(n => n.UserId == "other" && !n.IsRead);
        Assert.Equal(0, unreadUserCount);
        Assert.Equal(1, unreadOtherCount);
    }
}
