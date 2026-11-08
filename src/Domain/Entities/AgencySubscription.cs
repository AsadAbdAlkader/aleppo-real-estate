using Domain.Common;

namespace Domain.Entities;

public class AgencySubscription : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public Guid PlanId { get; set; }
    public SubscriptionPlan? Plan { get; set; }

    public string Status { get; set; } = "Active"; // Trialing, Active, PastDue, Cancelled, Expired
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; } = DateTime.UtcNow.AddYears(1);
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}
