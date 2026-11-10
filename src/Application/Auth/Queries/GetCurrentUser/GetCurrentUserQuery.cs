using Application.Auth.Dtos;
using Application.Common.Interfaces;
using Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Auth.Queries.GetCurrentUser;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserProfileDto?>;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserProfileDto?>
{
    private readonly IApplicationDbContext _context;

    public GetCurrentUserQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserProfileDto?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return null;
        }

        // Resolve active agency membership
        var agencyMember = await _context.AgencyMembers
            .AsNoTracking()
            .Where(m => m.UserId == user.Id && m.MembershipStatus == "Active")
            .OrderByDescending(m => m.Role == "Admin" ? 3 : m.Role == "Owner" ? 2 : 1)
            .FirstOrDefaultAsync(cancellationToken);

        Guid? agencyId = agencyMember?.AgencyId;

        if (!agencyId.HasValue)
        {
            var userIdStr = user.Id.ToString();
            var agentProfile = await _context.AgentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.UserId == userIdStr, cancellationToken);
            agencyId = agentProfile?.AgencyId;
        }

        if (!agencyId.HasValue && string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            var defaultAgency = await _context.Agencies
                .AsNoTracking()
                .OrderBy(a => a.CreatedAt)
                .Select(a => (Guid?)a.Id)
                .FirstOrDefaultAsync(cancellationToken);
            agencyId = defaultAgency;
        }

        var effectiveRole = agencyMember?.Role ?? user.Role;
        var permissions = DefaultRolePermissions.GetPermissionsForRole(effectiveRole).ToList();

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            AgencyId = agencyId,
            Permissions = permissions
        };
    }
}
