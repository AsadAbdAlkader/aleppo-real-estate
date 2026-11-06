using Application.Agents.Dtos;

namespace Application.Agencies.Dtos;

public class AgencyDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? CityArea { get; set; }
    public string? LogoUrl { get; set; }
    public string? LicenseNumber { get; set; }
    public int AgentsCount { get; set; }
    public int ActivePropertiesCount { get; set; }
    public List<AgentDto> Agents { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
