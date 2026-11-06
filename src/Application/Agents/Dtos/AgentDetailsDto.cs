namespace Application.Agents.Dtos;

public class AgentDetailsDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? AgencyId { get; set; }
    public string? AgencyName { get; set; }
    public string? AgencyDescription { get; set; }
    public string? Bio { get; set; }
    public string? PublicPhone { get; set; }
    public string? AgencyPhone { get; set; }
    public string? Address { get; set; }
    public string? CityArea { get; set; }
    public string? LogoUrl { get; set; }
    public string? LicenseNumber { get; set; }
    public int ActivePropertiesCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
