using Domain.Common;

namespace Domain.Entities;

public class Notification : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public Guid UserGuid
    {
        get => Guid.TryParse(UserId, out var g) ? g : Guid.Empty;
        set => UserId = value.ToString();
    }
    public User? User { get; set; }

    public Guid? AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
}
