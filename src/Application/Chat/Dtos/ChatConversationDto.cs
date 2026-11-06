namespace Application.Chat.Dtos;

public class ChatConversationDto
{
    public string OtherUserId { get; set; } = string.Empty;
    public string OtherUserName { get; set; } = string.Empty;
    public string OtherUserRole { get; set; } = string.Empty;
    public string? OtherUserPhone { get; set; }
    public string LastMessage { get; set; } = string.Empty;
    public int UnreadCount { get; set; }
    public DateTime LastMessageTime { get; set; }
    public Guid? PropertyId { get; set; }
    public string? PropertyTitle { get; set; }
}
