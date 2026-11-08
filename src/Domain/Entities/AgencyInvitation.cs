using Domain.Common;

namespace Domain.Entities;

public class AgencyInvitation : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Agent";
    public string TokenHash { get; set; } = string.Empty;

    public Guid? InvitedByUserId { get; set; }
    public User? InvitedByUser { get; set; }

    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
}
