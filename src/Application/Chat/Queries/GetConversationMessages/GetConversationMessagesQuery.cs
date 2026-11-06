using Application.Chat.Dtos;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Queries.GetConversationMessages;

public record GetConversationMessagesQuery(
    string CurrentUserId,
    string OtherUserId,
    Guid? PropertyId = null
) : IRequest<List<ChatMessageDto>>;

public class GetConversationMessagesQueryHandler : IRequestHandler<GetConversationMessagesQuery, List<ChatMessageDto>>
{
    private readonly IApplicationDbContext _context;

    public GetConversationMessagesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChatMessageDto>> Handle(GetConversationMessagesQuery request, CancellationToken cancellationToken)
    {
        // Mark unread messages sent by OtherUserId to CurrentUserId as IsRead = true
        var unreadMessages = await _context.ChatMessages
            .Where(m => m.SenderId == request.OtherUserId && m.ReceiverId == request.CurrentUserId && !m.IsRead)
            .ToListAsync(cancellationToken);

        if (unreadMessages.Any())
        {
            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Fetch conversation messages history
        var query = _context.ChatMessages
            .AsNoTracking()
            .Include(m => m.Property)
            .Where(m => (m.SenderId == request.CurrentUserId && m.ReceiverId == request.OtherUserId) ||
                        (m.SenderId == request.OtherUserId && m.ReceiverId == request.CurrentUserId));

        if (request.PropertyId.HasValue)
        {
            query = query.Where(m => m.PropertyId == request.PropertyId.Value);
        }

        var messages = await query
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ChatMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                ReceiverId = m.ReceiverId,
                PropertyId = m.PropertyId,
                PropertyTitle = m.Property != null ? m.Property.Title : null,
                Message = m.Message,
                IsRead = m.IsRead,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return messages;
    }
}
