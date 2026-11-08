using Domain.Common;

namespace Domain.Entities;

public class PropertyImage : BaseEntity
{
    public Guid AgencyId { get; set; }
    public Agency? Agency { get; set; }

    public Guid PropertyId { get; set; }
    public Property? Property { get; set; }

    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; } = false;
    public int SortOrder { get; set; } = 0;
}
