using Application.Auth.Dtos;
using Application.Common.Interfaces;
using Application.Common.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Auth.Commands.LoginUser;

public record LoginUserCommand : IRequest<AuthResponseDto>
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginUserCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        Guid? agencyId = null;
        var agentProfile = await _context.AgentProfiles
            .FirstOrDefaultAsync(ap => ap.UserId == user.Id.ToString(), cancellationToken);
        if (agentProfile != null)
        {
            agencyId = agentProfile.AgencyId;
        }
        else
        {
            var primaryMembership = await _context.AgencyMembers
                .Where(m => m.UserId == user.Id && m.MembershipStatus == "Active")
                .OrderBy(m => m.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
            if (primaryMembership != null)
            {
                agencyId = primaryMembership.AgencyId;
            }
        }

        var permissions = DefaultRolePermissions.GetPermissionsForRole(user.Role).ToList();
        var token = _jwtTokenGenerator.GenerateToken(user, agencyId, permissions);

        return new AuthResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Permissions = permissions,
            AgencyId = agencyId
        };
    }
}
