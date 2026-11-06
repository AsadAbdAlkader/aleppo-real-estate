namespace Application.Tours.Dtos;

public class TourBookingDto
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public string PropertyTitle { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public decimal PropertyPrice { get; set; }
    public string? PropertyImageUrl { get; set; }

    public string BuyerId { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerPhone { get; set; } = string.Empty;

    public DateTime TourDate { get; set; }
    public string TourType { get; set; } = "InPerson";
    public string Status { get; set; } = "Pending";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
