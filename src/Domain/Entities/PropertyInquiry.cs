using Domain.Common;

namespace Domain.Entities;

public class PropertyInquiry : BaseEntity
{
    public Guid? AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string CustomerName { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? CustomerEmail { get; set; }

    public string PhoneNumber { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string CustomerPhone
    {
        get => PhoneNumber;
        set => PhoneNumber = value;
    }

    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "New"; // New, InProgress, Contacted, Closed, Cancelled
    public string? AgentNotes { get; set; }
}
