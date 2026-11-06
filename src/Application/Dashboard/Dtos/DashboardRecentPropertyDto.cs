namespace Application.Dashboard.Dtos;

public class DashboardRecentPropertyDto
{
    public Guid Id { get; set; }
    public string? OwnerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Category { get; set; } = string.Empty;
    public string CityArea { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<string> ImageUrls { get; set; } = new();
}
