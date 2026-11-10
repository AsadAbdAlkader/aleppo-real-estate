using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Queries.GetMyProperties;

public record GetMyPropertiesQuery(string OwnerId) : IRequest<List<PropertyDto>>;

public class GetMyPropertiesQueryHandler : IRequestHandler<GetMyPropertiesQuery, List<PropertyDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext? _tenantContext;

    public GetMyPropertiesQueryHandler(IApplicationDbContext context, ITenantContext? tenantContext = null)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<List<PropertyDto>> Handle(GetMyPropertiesQuery request, CancellationToken cancellationToken)
    {
        if (_tenantContext != null)
        {
            await _tenantContext.EnsureValidAgencyContextAsync(cancellationToken);
        }

        var query = _context.Properties.AsNoTracking();

        if (_tenantContext?.AgencyId.HasValue == true)
        {
            var agencyId = _tenantContext.AgencyId.Value;
            query = query.Where(p => p.AgencyId == agencyId || p.OwnerId == request.OwnerId);
        }
        else
        {
            query = query.Where(p => p.OwnerId == request.OwnerId);
        }

        return await query
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
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                AgencyId = p.AgencyId,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
