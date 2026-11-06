using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Queries.GetProperties;

public record GetPropertiesQuery : IRequest<PaginatedList<PropertyDto>>
{
    public string? SearchTerm { get; init; }
    public string? City { get; init; }
    public string? CityArea { get; init; }
    public string? Category { get; init; }
    public string? Purpose { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public double? MinArea { get; init; }
    public double? MaxArea { get; init; }
    public int? Bedrooms { get; init; }
    public int? Bathrooms { get; init; }
    public string? Status { get; init; }
    public string? SortBy { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class GetPropertiesQueryHandler : IRequestHandler<GetPropertiesQuery, PaginatedList<PropertyDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPropertiesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<PropertyDto>> Handle(GetPropertiesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Properties.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            query = query.Where(p => 
                p.Title.Contains(term) || 
                p.Description.Contains(term) || 
                p.Address.Contains(term) ||
                p.CityArea.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var city = request.City.Trim();
            query = query.Where(p => p.City.ToLower() == city.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(request.CityArea))
        {
            var area = request.CityArea.Trim();
            query = query.Where(p => p.CityArea.ToLower() == area.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var cat = request.Category.Trim();
            query = query.Where(p => p.Category.ToLower() == cat.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(request.Purpose))
        {
            var purpose = request.Purpose.Trim();
            query = query.Where(p => p.Purpose.ToLower() == purpose.ToLower());
        }

        if (request.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= request.MaxPrice.Value);
        }

        if (request.MinArea.HasValue)
        {
            query = query.Where(p => p.AreaSquareMeters >= request.MinArea.Value);
        }

        if (request.MaxArea.HasValue)
        {
            query = query.Where(p => p.AreaSquareMeters <= request.MaxArea.Value);
        }

        if (request.Bedrooms.HasValue)
        {
            query = query.Where(p => p.Bedrooms >= request.Bedrooms.Value);
        }

        if (request.Bathrooms.HasValue)
        {
            query = query.Where(p => p.Bathrooms >= request.Bathrooms.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim();
            query = query.Where(p => p.Status.ToLower() == status.ToLower());
        }
        else
        {
            query = query.Where(p => p.Status != "Archived");
        }

        query = request.SortBy?.Trim().ToLower() switch
        {
            "date_asc" => query.OrderBy(p => p.CreatedAt),
            "price_asc" => query.OrderBy(p => p.Price).ThenByDescending(p => p.CreatedAt),
            "price_desc" => query.OrderByDescending(p => p.Price).ThenByDescending(p => p.CreatedAt),
            "area_asc" => query.OrderBy(p => p.AreaSquareMeters).ThenByDescending(p => p.CreatedAt),
            "area_desc" => query.OrderByDescending(p => p.AreaSquareMeters).ThenByDescending(p => p.CreatedAt),
            "date_desc" or _ => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt)
        };

        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var dtoQuery = query.Select(p => new PropertyDto
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
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        });

        return await PaginatedList<PropertyDto>.CreateAsync(dtoQuery, pageNumber, pageSize, cancellationToken);
    }
}
