using Domain.Common;

namespace Domain.Entities;

public class AgencySetting : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public string? PublicPhone { get; set; }
    public string? PublicEmail { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? AboutText { get; set; }
    public string? WorkingHours { get; set; } // jsonb
    public string? SocialLinks { get; set; } // jsonb
    public bool AllowPublicInquiries { get; set; } = true;
}
