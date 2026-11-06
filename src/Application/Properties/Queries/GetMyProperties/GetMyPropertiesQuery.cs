using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Queries.GetMyProperties;

public record GetMyPropertiesQuery(string OwnerId) : IRequest<List<PropertyDto>>;

public class GetMyPropertiesQueryHandler : IRequestHandler<GetMyPropertiesQuery, List<PropertyDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyPropertiesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PropertyDto>> Handle(GetMyPropertiesQuery request, CancellationToken cancellationToken)
    {
        return await _context.Properties
            .AsNoTracking()
            .Where(p => p.OwnerId == request.OwnerId)
            .OrderByDescending(p => p.CreatedAt)
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
            .ToListAsync(cancellationToken);
    }
}
