using Domain.Common;

namespace Domain.Entities;

public class PropertyTourBooking : BaseEntity
{
    public Guid PropertyId { get; set; }
    public Property? Property { get; set; }

    public string BuyerId { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerPhone { get; set; } = string.Empty;

    public DateTime TourDate { get; set; }
    public string TourType { get; set; } = "InPerson"; // InPerson, VideoCall
    public string Status { get; set; } = "Pending";     // Pending, Confirmed, Cancelled, Completed
    public string? Notes { get; set; }
}
