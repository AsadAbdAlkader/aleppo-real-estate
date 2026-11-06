using Application.Agents.Dtos;
using Application.Common.Interfaces;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agents.Queries.GetAgents;

public record GetAgentsQuery : IRequest<PaginatedList<AgentDto>>
{
    public string? SearchTerm { get; init; }
    public string? CityArea { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class GetAgentsQueryHandler : IRequestHandler<GetAgentsQuery, PaginatedList<AgentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAgentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<AgentDto>> Handle(GetAgentsQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var query = _context.Users.AsNoTracking()
            .Where(u => u.Role == "Agent");

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(u =>
                (u.FirstName + " " + u.LastName).ToLower().Contains(term) ||
                _context.AgentProfiles.Any(ap => ap.UserId == u.Id.ToString() && ap.Agency != null && ap.Agency.Name.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.CityArea))
        {
            var cityArea = request.CityArea.Trim().ToLower();
            query = query.Where(u =>
                _context.AgentProfiles.Any(ap => ap.UserId == u.Id.ToString() && ap.Agency != null && ap.Agency.CityArea != null && ap.Agency.CityArea.ToLower().Contains(cityArea)));
        }

        var projected = query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AgentDto
            {
                Id = u.Id.ToString(),
                Name = (u.FirstName + " " + u.LastName).Trim(),
                AgencyId = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString()).Select(ap => ap.AgencyId).FirstOrDefault(),
                AgencyName = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString() && ap.Agency != null).Select(ap => ap.Agency!.Name).FirstOrDefault(),
                Bio = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString()).Select(ap => ap.Bio).FirstOrDefault(),
                PublicPhone = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString()).Select(ap => ap.PublicPhone).FirstOrDefault(),
                Address = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString() && ap.Agency != null).Select(ap => ap.Agency!.Address).FirstOrDefault(),
                CityArea = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString() && ap.Agency != null).Select(ap => ap.Agency!.CityArea).FirstOrDefault(),
                LogoUrl = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString() && ap.Agency != null).Select(ap => ap.Agency!.LogoUrl).FirstOrDefault(),
                LicenseNumber = _context.AgentProfiles.Where(ap => ap.UserId == u.Id.ToString() && ap.Agency != null).Select(ap => ap.Agency!.LicenseNumber).FirstOrDefault(),
                ActivePropertiesCount = _context.Properties.Count(p => p.OwnerId == u.Id.ToString() && p.Status != "Archived"),
                CreatedAt = u.CreatedAt
            });

        return await PaginatedList<AgentDto>.CreateAsync(projected, pageNumber, pageSize, cancellationToken);
    }
}
