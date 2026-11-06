using Application.Chat.Dtos;
using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Commands.SendChatMessage;

public record SendChatMessageCommand(
    string CurrentUserId,
    string ReceiverId,
    Guid? PropertyId,
    string Message
) : IRequest<ChatMessageDto?>;

public class SendChatMessageCommandHandler : IRequestHandler<SendChatMessageCommand, ChatMessageDto?>
{
    private readonly IApplicationDbContext _context;

    public SendChatMessageCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChatMessageDto?> Handle(SendChatMessageCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify receiver exists
        var receiver = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id.ToString() == request.ReceiverId, cancellationToken);

        if (receiver == null)
        {
            return null;
        }

        // 2. Fetch sender for notification details
        var sender = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id.ToString() == request.CurrentUserId, cancellationToken);

        var senderName = sender != null
            ? $"{sender.FirstName} {sender.LastName}".Trim()
            : "مستخدم";

        if (string.IsNullOrWhiteSpace(senderName))
        {
            senderName = "مستخدم";
        }

        // 3. Fetch property title if PropertyId is provided
        string? propertyTitle = null;
        if (request.PropertyId.HasValue)
        {
            var property = await _context.Properties
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.PropertyId.Value, cancellationToken);

            propertyTitle = property?.Title;
        }

        // 4. Create ChatMessage entity
        var chatMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SenderId = request.CurrentUserId,
            ReceiverId = request.ReceiverId,
            PropertyId = request.PropertyId,
            Message = request.Message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(chatMessage);

        // 5. Automatically create Notification entity for receiver ("رسالة جديدة من " + senderName)
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = receiver.Id.ToString(),
            Title = "رسالة جديدة",
            Message = $"رسالة جديدة من {senderName}",
            Type = "ChatMessageReceived",
            ReferenceId = chatMessage.Id.ToString(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);

        // 6. Save changes atomically in one transaction
        await _context.SaveChangesAsync(cancellationToken);

        // 7. Return ChatMessageDto
        return new ChatMessageDto
        {
            Id = chatMessage.Id,
            SenderId = chatMessage.SenderId,
            ReceiverId = chatMessage.ReceiverId,
            PropertyId = chatMessage.PropertyId,
            PropertyTitle = propertyTitle,
            Message = chatMessage.Message,
            IsRead = chatMessage.IsRead,
            CreatedAt = chatMessage.CreatedAt
        };
    }
}
