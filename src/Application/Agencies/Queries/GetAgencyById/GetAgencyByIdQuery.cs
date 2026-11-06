using Application.Agencies.Dtos;
using Application.Agents.Dtos;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agencies.Queries.GetAgencyById;

public record GetAgencyByIdQuery(Guid Id) : IRequest<AgencyDetailsDto?>;

public class GetAgencyByIdQueryHandler : IRequestHandler<GetAgencyByIdQuery, AgencyDetailsDto?>
{
    private readonly IApplicationDbContext _context;

    public GetAgencyByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AgencyDetailsDto?> Handle(GetAgencyByIdQuery request, CancellationToken cancellationToken)
    {
        var agency = await _context.Agencies.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (agency == null)
        {
            return null;
        }

        var agentsCount = await _context.AgentProfiles.AsNoTracking()
            .CountAsync(ap => ap.AgencyId == agency.Id, cancellationToken);

        var agencyAgentUserIds = await _context.AgentProfiles.AsNoTracking()
            .Where(ap => ap.AgencyId == agency.Id)
            .Select(ap => ap.UserId)
            .ToListAsync(cancellationToken);

        var activePropertiesCount = await _context.Properties.AsNoTracking()
            .CountAsync(p => p.OwnerId != null && agencyAgentUserIds.Contains(p.OwnerId) && p.Status != "Archived", cancellationToken);

        var agentsList = await _context.AgentProfiles.AsNoTracking()
            .Where(ap => ap.AgencyId == agency.Id)
            .Select(ap => new AgentDto
            {
                Id = ap.UserId,
                Name = ap.User != null ? (ap.User.FirstName + " " + ap.User.LastName).Trim() : string.Empty,
                AgencyId = agency.Id,
                AgencyName = agency.Name,
                Bio = ap.Bio,
                PublicPhone = ap.PublicPhone,
                Address = agency.Address,
                CityArea = agency.CityArea,
                LogoUrl = agency.LogoUrl,
                LicenseNumber = agency.LicenseNumber,
                ActivePropertiesCount = _context.Properties.Count(p => p.OwnerId == ap.UserId && p.Status != "Archived"),
                CreatedAt = ap.User != null ? ap.User.CreatedAt : ap.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new AgencyDetailsDto
        {
            Id = agency.Id,
            Name = agency.Name,
            Description = agency.Description,
            PhoneNumber = agency.PhoneNumber,
            Address = agency.Address,
            CityArea = agency.CityArea,
            LogoUrl = agency.LogoUrl,
            LicenseNumber = agency.LicenseNumber,
            AgentsCount = agentsCount,
            ActivePropertiesCount = activePropertiesCount,
            Agents = agentsList,
            CreatedAt = agency.CreatedAt
        };
    }
}
