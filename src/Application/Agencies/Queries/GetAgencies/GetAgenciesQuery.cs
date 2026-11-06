using Application.Agencies.Dtos;
using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agencies.Queries.GetAgencies;

public record GetAgenciesQuery : IRequest<PaginatedList<AgencyDto>>
{
    public string? SearchTerm { get; init; }
    public string? CityArea { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class GetAgenciesQueryHandler : IRequestHandler<GetAgenciesQuery, PaginatedList<AgencyDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAgenciesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<AgencyDto>> Handle(GetAgenciesQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var query = _context.Agencies.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(a => a.Name.ToLower().Contains(term) || (a.Description != null && a.Description.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.CityArea))
        {
            var cityArea = request.CityArea.Trim().ToLower();
            query = query.Where(a => a.CityArea != null && a.CityArea.ToLower().Contains(cityArea));
        }

        var projected = query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AgencyDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                PhoneNumber = a.PhoneNumber,
                Address = a.Address,
                CityArea = a.CityArea,
                LogoUrl = a.LogoUrl,
                LicenseNumber = a.LicenseNumber,
                AgentsCount = _context.AgentProfiles.Count(ap => ap.AgencyId == a.Id),
                ActivePropertiesCount = _context.Properties.Count(p =>
                    _context.AgentProfiles.Where(ap => ap.AgencyId == a.Id).Select(ap => ap.UserId).Contains(p.OwnerId) &&
                    p.Status != "Archived"),
                CreatedAt = a.CreatedAt
            });

        return await PaginatedList<AgencyDto>.CreateAsync(projected, pageNumber, pageSize, cancellationToken);
    }
}
