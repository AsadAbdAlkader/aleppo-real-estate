namespace Application.Chat.Dtos;

public class SendChatMessageRequestDto
{
    public string ReceiverId { get; set; } = string.Empty;
    public Guid? PropertyId { get; set; }
    public string Message { get; set; } = string.Empty;
}
