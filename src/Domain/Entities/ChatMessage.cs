using Domain.Common;

namespace Domain.Entities;

public class ChatMessage : BaseEntity
{
    public Guid? ConversationId { get; set; }
    public Conversation? Conversation { get; set; }

    public Guid? SenderUserId { get; set; }
    public Guid? ReceiverUserId { get; set; }

    public string SenderId { get; set; } = string.Empty;
    public Guid SenderGuid
    {
        get => Guid.TryParse(SenderId, out var g) ? g : (SenderUserId ?? Guid.Empty);
        set
        {
            SenderId = value.ToString();
            SenderUserId = value;
        }
    }
    public User? Sender { get; set; }

    public string ReceiverId { get; set; } = string.Empty;
    public Guid ReceiverGuid
    {
        get => Guid.TryParse(ReceiverId, out var g) ? g : (ReceiverUserId ?? Guid.Empty);
        set
        {
            ReceiverId = value.ToString();
            ReceiverUserId = value;
        }
    }
    public User? Receiver { get; set; }

    public Guid? PropertyId { get; set; }
    public Property? Property { get; set; }

    public string Message { get; set; } = string.Empty;
    public string MessageType { get; set; } = "Text";
    public bool IsRead { get; set; } = false;
    public DateTime? EditedAt { get; set; }
}
