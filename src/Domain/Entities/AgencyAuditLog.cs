using Domain.Common;

namespace Domain.Entities;

public class AgencyAuditLog : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? OldValues { get; set; } // jsonb
    public string? NewValues { get; set; } // jsonb
    public string? IpAddress { get; set; }
}
