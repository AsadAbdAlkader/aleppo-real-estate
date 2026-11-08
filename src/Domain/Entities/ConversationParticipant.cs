using Domain.Common;

namespace Domain.Entities;

public class ConversationParticipant : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Conversation? Conversation { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string ParticipantRole { get; set; } = "Buyer"; // Buyer, Agent, Admin
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReadAt { get; set; }
}
