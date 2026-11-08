using Domain.Common;

namespace Domain.Entities;

public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // TRIAL, PRO, ENTERPRISE
    public string? Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal YearlyPrice { get; set; }
    public int MaxProperties { get; set; } = 50;
    public int MaxMembers { get; set; } = 5;
    public bool IsActive { get; set; } = true;
    public string? Features { get; set; } // jsonb
}
