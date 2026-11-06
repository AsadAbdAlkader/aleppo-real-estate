using Application.Agents.Dtos;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agents.Queries.GetAgentById;

public record GetAgentByIdQuery(string Id) : IRequest<AgentDetailsDto?>;

public class GetAgentByIdQueryHandler : IRequestHandler<GetAgentByIdQuery, AgentDetailsDto?>
{
    private readonly IApplicationDbContext _context;

    public GetAgentByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AgentDetailsDto?> Handle(GetAgentByIdQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Id))
        {
            return null;
        }

        var user = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Role == "Agent" && u.Id.ToString() == request.Id, cancellationToken);

        if (user == null)
        {
            return null;
        }

        var profile = await _context.AgentProfiles.AsNoTracking()
            .Include(ap => ap.Agency)
            .FirstOrDefaultAsync(ap => ap.UserId == user.Id.ToString(), cancellationToken);

        var activePropertiesCount = await _context.Properties.AsNoTracking()
            .CountAsync(p => p.OwnerId == user.Id.ToString() && p.Status != "Archived", cancellationToken);

        var fullName = $"{user.FirstName} {user.LastName}".Trim();

        return new AgentDetailsDto
        {
            Id = user.Id.ToString(),
            Name = fullName,
            AgencyId = profile?.AgencyId,
            AgencyName = profile?.Agency?.Name,
            AgencyDescription = profile?.Agency?.Description,
            Bio = profile?.Bio,
            PublicPhone = profile?.PublicPhone,
            AgencyPhone = profile?.Agency?.PhoneNumber,
            Address = profile?.Agency?.Address,
            CityArea = profile?.Agency?.CityArea,
            LogoUrl = profile?.Agency?.LogoUrl,
            LicenseNumber = profile?.Agency?.LicenseNumber,
            ActivePropertiesCount = activePropertiesCount,
            CreatedAt = user.CreatedAt
        };
    }
}
