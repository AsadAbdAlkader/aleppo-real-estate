using Domain.Common;

namespace Domain.Entities;

public class AgencyMember : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string Role { get; set; } = "Agent"; // Owner, Admin, Agent, Employee, Viewer
    public string MembershipStatus { get; set; } = "Active"; // Invited, Active, Suspended, Removed
    public DateTime? JoinedAt { get; set; } = DateTime.UtcNow;

    public Guid? InvitedByUserId { get; set; }
    public User? InvitedByUser { get; set; }
}
