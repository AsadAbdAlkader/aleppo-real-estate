using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Favorites.Queries.GetUserFavorites;

public record GetUserFavoritesQuery(Guid UserId) : IRequest<List<PropertyDto>>;

public class GetUserFavoritesQueryHandler : IRequestHandler<GetUserFavoritesQuery, List<PropertyDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUserFavoritesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PropertyDto>> Handle(GetUserFavoritesQuery request, CancellationToken cancellationToken)
    {
        var favorites = await _context.FavoriteProperties
            .AsNoTracking()
            .Where(f => f.UserId == request.UserId)
            .Include(f => f.Property)
            .Select(f => f.Property)
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

        return favorites;
    }
}
