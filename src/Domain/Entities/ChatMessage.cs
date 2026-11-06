using Domain.Common;

namespace Domain.Entities;

public class ChatMessage : BaseEntity
{
    public string SenderId { get; set; } = string.Empty;
    public Guid SenderGuid
    {
        get => Guid.TryParse(SenderId, out var g) ? g : Guid.Empty;
        set => SenderId = value.ToString();
    }
    public User? Sender { get; set; }

    public string ReceiverId { get; set; } = string.Empty;
    public Guid ReceiverGuid
    {
        get => Guid.TryParse(ReceiverId, out var g) ? g : Guid.Empty;
        set => ReceiverId = value.ToString();
    }
    public User? Receiver { get; set; }

    public Guid? PropertyId { get; set; }
    public Property? Property { get; set; }

    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
}
