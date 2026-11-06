using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Queries.GetPropertyById;

public record GetPropertyByIdQuery(Guid Id) : IRequest<PropertyDto?>;

public class GetPropertyByIdQueryHandler : IRequestHandler<GetPropertyByIdQuery, PropertyDto?>
{
    private readonly IApplicationDbContext _context;

    public GetPropertyByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PropertyDto?> Handle(GetPropertyByIdQuery request, CancellationToken cancellationToken)
    {
        var property = await _context.Properties
            .AsNoTracking()
            .Where(p => p.Id == request.Id)
            .Select(p => new PropertyDto
            {
                Id = p.Id,
                OwnerId = p.OwnerId,
                OwnerName = p.Owner != null ? (p.Owner.FirstName + " " + p.Owner.LastName).Trim() : null,
                Title = p.Title,
                Description = p.Description,
                Price = p.Price,
                Category = p.Category,
                Purpose = p.Purpose,
                City = p.City,
                CityArea = p.CityArea,
                Address = p.Address,
                Bedrooms = p.Bedrooms,
                Bathrooms = p.Bathrooms,
                AreaSquareMeters = p.AreaSquareMeters,
                ImageUrls = p.ImageUrls,
                Status = p.Status,
                IsFeatured = p.IsFeatured,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (property is null || string.Equals(property.Status, "Archived", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return property;
    }
}
