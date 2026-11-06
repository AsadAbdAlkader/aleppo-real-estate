using Application.Chat.Commands.SendChatMessage;
using Application.Chat.Dtos;
using Application.Chat.Queries.GetConversationMessages;
using Application.Chat.Queries.GetMyConversations;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Application.UnitTests.Chat;

public class ChatTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetMyConversationsQueryHandler_ShouldReturnGroupedConversationsWithUnreadCount()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var buyerId = Guid.NewGuid();
        var agentId = Guid.NewGuid();

        var buyer = new User
        {
            Id = buyerId,
            Email = "buyer@aleppo.com",
            FirstName = "Ahmad",
            LastName = "Buyer",
            Role = "Buyer"
        };

        var agent = new User
        {
            Id = agentId,
            Email = "agent@aleppo.com",
            FirstName = "Samer",
            LastName = "Agent",
            Role = "Agent"
        };

        var property = new Property
        {
            Id = Guid.NewGuid(),
            Title = "شقة تجريبية",
            Description = "الوصف",
            Price = 100000,
            Category = "Apartment",
            CityArea = "الشهباء",
            Address = "العنوان"
        };

        context.Users.AddRange(buyer, agent);
        context.Properties.Add(property);

        var msg1 = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SenderId = buyerId.ToString(),
            ReceiverId = agentId.ToString(),
            PropertyId = property.Id,
            Message = "الرسالة الأولى",
            IsRead = true,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        var msg2 = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SenderId = agentId.ToString(),
            ReceiverId = buyerId.ToString(),
            PropertyId = property.Id,
            Message = "الرسالة الثانية الغير مقروءة",
            IsRead = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        };

        context.ChatMessages.AddRange(msg1, msg2);
        await context.SaveChangesAsync();

        var handler = new GetMyConversationsQueryHandler(context);
        var query = new GetMyConversationsQuery(buyerId.ToString());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var conversation = result[0];
        Assert.Equal(agentId.ToString(), conversation.OtherUserId);
        Assert.Equal("Samer Agent", conversation.OtherUserName);
        Assert.Equal("Agent", conversation.OtherUserRole);
        Assert.Equal("الرسالة الثانية الغير مقروءة", conversation.LastMessage);
        Assert.Equal(1, conversation.UnreadCount);
        Assert.Equal(property.Id, conversation.PropertyId);
    }

    [Fact]
    public async Task GetConversationMessagesQueryHandler_ShouldFetchMessagesAndMarkUnreadAsRead()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var buyerId = Guid.NewGuid();
        var agentId = Guid.NewGuid();

        var unreadMsg = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SenderId = agentId.ToString(),
            ReceiverId = buyerId.ToString(),
            Message = "رسالة غير مقروءة",
            IsRead = false,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        };

        context.ChatMessages.Add(unreadMsg);
        await context.SaveChangesAsync();

        var handler = new GetConversationMessagesQueryHandler(context);
        var query = new GetConversationMessagesQuery(buyerId.ToString(), agentId.ToString());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.True(result[0].IsRead);

        var dbMsg = await context.ChatMessages.FindAsync(unreadMsg.Id);
        Assert.NotNull(dbMsg);
        Assert.True(dbMsg.IsRead);
    }

    [Fact]
    public async Task SendChatMessageCommandHandler_ShouldCreateMessageAndNotification()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();

        var buyerId = Guid.NewGuid();
        var agentId = Guid.NewGuid();

        var buyer = new User
        {
            Id = buyerId,
            FirstName = "أحمد",
            LastName = "الحلبي",
            Email = "buyer@aleppo.com"
        };

        var agent = new User
        {
            Id = agentId,
            FirstName = "سامر",
            LastName = "العقاري",
            Email = "agent@aleppo.com"
        };

        context.Users.AddRange(buyer, agent);
        await context.SaveChangesAsync();

        var handler = new SendChatMessageCommandHandler(context);
        var command = new SendChatMessageCommand(
            buyerId.ToString(),
            agentId.ToString(),
            null,
            "مرحباً أرغب في الاستفسار عن العقار"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(buyerId.ToString(), result.SenderId);
        Assert.Equal(agentId.ToString(), result.ReceiverId);
        Assert.Equal("مرحباً أرغب في الاستفسار عن العقار", result.Message);
        Assert.False(result.IsRead);

        var createdMessage = await context.ChatMessages.FirstOrDefaultAsync(m => m.Id == result.Id);
        Assert.NotNull(createdMessage);

        var createdNotification = await context.Notifications.FirstOrDefaultAsync(n => n.UserId == agentId.ToString());
        Assert.NotNull(createdNotification);
        Assert.Equal("رسالة جديدة", createdNotification.Title);
        Assert.Equal("رسالة جديدة من أحمد الحلبي", createdNotification.Message);
        Assert.Equal("ChatMessageReceived", createdNotification.Type);
    }

    [Fact]
    public async Task SendChatMessageCommandValidator_ShouldValidateRequiredFields()
    {
        // Arrange
        var validator = new SendChatMessageCommandValidator();

        var invalidCommand = new SendChatMessageCommand(
            "",
            "",
            null,
            ""
        );

        // Act
        var validationResult = await validator.ValidateAsync(invalidCommand);

        // Assert
        Assert.False(validationResult.IsValid);
        Assert.Contains(validationResult.Errors, e => e.PropertyName == "CurrentUserId");
        Assert.Contains(validationResult.Errors, e => e.PropertyName == "ReceiverId");
        Assert.Contains(validationResult.Errors, e => e.PropertyName == "Message");
    }
}
