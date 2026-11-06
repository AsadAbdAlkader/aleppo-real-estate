using Application.Common.Interfaces;
using Application.Properties.Dtos;
using Domain.Entities;
using MediatR;

namespace Application.Properties.Commands.CreateProperty;

public record CreatePropertyCommand : IRequest<PropertyDto>
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Purpose { get; init; } = "Sale";
    public string City { get; init; } = "حلب";
    public string CityArea { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public int Bedrooms { get; init; }
    public int Bathrooms { get; init; }
    public double AreaSquareMeters { get; init; }
    public List<string> ImageUrls { get; init; } = new();
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public string? OwnerId { get; set; }
}

public class CreatePropertyCommandHandler : IRequestHandler<CreatePropertyCommand, PropertyDto>
{
    private readonly IApplicationDbContext _context;

    public CreatePropertyCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PropertyDto> Handle(CreatePropertyCommand request, CancellationToken cancellationToken)
    {
        var property = new Property
        {
            Id = Guid.NewGuid(),
            OwnerId = request.OwnerId,
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Category = request.Category,
            Purpose = string.IsNullOrWhiteSpace(request.Purpose) ? "Sale" : request.Purpose,
            City = string.IsNullOrWhiteSpace(request.City) ? "حلب" : request.City,
            CityArea = request.CityArea,
            Address = request.Address,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            AreaSquareMeters = request.AreaSquareMeters,
            ImageUrls = request.ImageUrls ?? new List<string>(),
            Status = "Available",
            IsFeatured = false,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CreatedAt = DateTime.UtcNow
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync(cancellationToken);

        string? ownerName = null;
        if (!string.IsNullOrEmpty(property.OwnerId))
        {
            var owner = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                _context.Users, u => u.Id.ToString() == property.OwnerId, cancellationToken);
            if (owner != null)
            {
                var fullName = $"{owner.FirstName} {owner.LastName}".Trim();
                ownerName = string.IsNullOrWhiteSpace(fullName) ? null : fullName;
            }
        }

        return new PropertyDto
        {
            Id = property.Id,
            OwnerId = property.OwnerId,
            OwnerName = ownerName,
            Title = property.Title,
            Description = property.Description,
            Price = property.Price,
            Category = property.Category,
            Purpose = property.Purpose,
            City = property.City,
            CityArea = property.CityArea,
            Address = property.Address,
            Bedrooms = property.Bedrooms,
            Bathrooms = property.Bathrooms,
            AreaSquareMeters = property.AreaSquareMeters,
            ImageUrls = property.ImageUrls,
            Status = property.Status,
            IsFeatured = property.IsFeatured,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            CreatedAt = property.CreatedAt,
            UpdatedAt = property.UpdatedAt
        };
    }
}
