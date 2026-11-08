using Domain.Common;

namespace Domain.Entities;

public class Conversation : BaseEntity
{
    public Guid? AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public Guid? PropertyId { get; set; }
    public Property? Property { get; set; }

    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
