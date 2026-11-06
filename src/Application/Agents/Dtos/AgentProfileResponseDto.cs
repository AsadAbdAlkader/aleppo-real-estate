namespace Application.Agents.Dtos;

public class AgentProfileResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? PublicPhone { get; set; }
    public Guid? AgencyId { get; set; }
}
