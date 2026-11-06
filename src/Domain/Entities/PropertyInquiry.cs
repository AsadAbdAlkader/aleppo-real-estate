using Domain.Common;

namespace Domain.Entities;

public class PropertyInquiry : BaseEntity
{
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Message { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public string Status { get; set; } = "New";
    public string? AgentNotes { get; set; }
}
