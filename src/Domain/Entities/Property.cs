using Domain.Common;

namespace Domain.Entities;

public class Property : BaseEntity
{
    public string? OwnerId { get; set; }
    public Guid? OwnerGuid
    {
        get => string.IsNullOrEmpty(OwnerId) ? null : Guid.TryParse(OwnerId, out var g) ? g : null;
        set => OwnerId = value?.ToString();
    }
    public User? Owner { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Purpose { get; set; } = "Sale";
    public string City { get; set; } = "حلب";
    public string CityArea { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public double AreaSquareMeters { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public string Status { get; set; } = "Available";
    public bool IsFeatured { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
