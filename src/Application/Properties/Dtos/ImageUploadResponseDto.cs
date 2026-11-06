namespace Application.Properties.Dtos;

public class ImageUploadResponseDto
{
    public Guid PropertyId { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public string? PrimaryImageUrl { get; set; }
}
