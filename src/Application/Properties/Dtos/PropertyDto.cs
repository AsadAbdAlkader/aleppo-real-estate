namespace Application.Properties.Dtos;

public class PropertyDto
{
    public Guid Id { get; set; }
    public string? OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string CityArea { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public double AreaSquareMeters { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
