using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agents.Queries.GetAgentProperties;

public record GetAgentPropertiesQuery(string AgentId, int PageNumber = 1, int PageSize = 10) : IRequest<PaginatedList<PropertyDto>>;

public class GetAgentPropertiesQueryHandler : IRequestHandler<GetAgentPropertiesQuery, PaginatedList<PropertyDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAgentPropertiesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<PropertyDto>> Handle(GetAgentPropertiesQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var query = _context.Properties.AsNoTracking()
            .Include(p => p.Owner)
            .Where(p => p.OwnerId == request.AgentId && p.Status != "Archived")
            .OrderByDescending(p => p.CreatedAt);

        var projected = query.Select(p => new PropertyDto
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
        });

        return await PaginatedList<PropertyDto>.CreateAsync(projected, pageNumber, pageSize, cancellationToken);
    }
}
