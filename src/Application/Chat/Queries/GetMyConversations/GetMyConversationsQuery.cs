using Application.Chat.Dtos;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Chat.Queries.GetMyConversations;

public record GetMyConversationsQuery(string CurrentUserId) : IRequest<List<ChatConversationDto>>;

public class GetMyConversationsQueryHandler : IRequestHandler<GetMyConversationsQuery, List<ChatConversationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyConversationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChatConversationDto>> Handle(GetMyConversationsQuery request, CancellationToken cancellationToken)
    {
        var messages = await _context.ChatMessages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Include(m => m.Property)
            .Where(m => m.SenderId == request.CurrentUserId || m.ReceiverId == request.CurrentUserId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        if (!messages.Any())
        {
            return new List<ChatConversationDto>();
        }

        var grouped = messages
            .GroupBy(m => m.SenderId == request.CurrentUserId ? m.ReceiverId : m.SenderId);

        var conversations = new List<ChatConversationDto>();

        foreach (var group in grouped)
        {
            var otherUserId = group.Key;
            var latestMessage = group.First();

            var otherUser = latestMessage.SenderId == request.CurrentUserId
                ? latestMessage.Receiver
                : latestMessage.Sender;

            if (otherUser == null)
            {
                otherUser = group
                    .Select(m => m.SenderId == otherUserId ? m.Sender : (m.ReceiverId == otherUserId ? m.Receiver : null))
                    .FirstOrDefault(u => u != null);
            }

            var unreadCount = group.Count(m => m.ReceiverId == request.CurrentUserId && !m.IsRead);

            var otherUserName = otherUser != null
                ? $"{otherUser.FirstName} {otherUser.LastName}".Trim()
                : "مستخدم";

            conversations.Add(new ChatConversationDto
            {
                OtherUserId = otherUserId,
                OtherUserName = string.IsNullOrWhiteSpace(otherUserName) ? "مستخدم" : otherUserName,
                OtherUserRole = otherUser?.Role ?? "Buyer",
                OtherUserPhone = otherUser?.PhoneNumber,
                LastMessage = latestMessage.Message,
                UnreadCount = unreadCount,
                LastMessageTime = latestMessage.CreatedAt,
                PropertyId = latestMessage.PropertyId,
                PropertyTitle = latestMessage.Property?.Title
            });
        }

        return conversations.OrderByDescending(c => c.LastMessageTime).ToList();
    }
}
