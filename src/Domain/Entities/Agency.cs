using Domain.Common;

namespace Domain.Entities;

public class Agency : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? CityArea { get; set; }
    public string? LogoUrl { get; set; }
    public string? LicenseNumber { get; set; }

    public ICollection<AgentProfile> AgentProfiles { get; set; } = new List<AgentProfile>();
}
