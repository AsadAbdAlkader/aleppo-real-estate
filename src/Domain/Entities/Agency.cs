using Domain.Common;

namespace Domain.Entities;

public class Agency : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string City { get; set; } = "حلب";
    public string? CityArea { get; set; }
    public string? LogoUrl { get; set; }
    public string? LicenseNumber { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<AgentProfile> AgentProfiles { get; set; } = new List<AgentProfile>();
    public ICollection<AgencyMember> Members { get; set; } = new List<AgencyMember>();
    public ICollection<Property> Properties { get; set; } = new List<Property>();
    public ICollection<AgencySubscription> Subscriptions { get; set; } = new List<AgencySubscription>();
    public AgencySetting? Settings { get; set; }
}
