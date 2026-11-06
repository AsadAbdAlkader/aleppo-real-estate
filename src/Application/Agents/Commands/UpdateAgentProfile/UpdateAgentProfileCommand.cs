using Application.Agents.Dtos;
using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agents.Commands.UpdateAgentProfile;

public record UpdateAgentProfileCommand : IRequest<UpdateAgentProfileResult>
{
    public string CurrentUserId { get; init; } = string.Empty;
    public string UserRole { get; init; } = string.Empty;
    public string? Bio { get; init; }
    public string? PublicPhone { get; init; }
    public Guid? AgencyId { get; init; }
}

public enum AgentProfileCommandStatus
{
    Success,
    NotFound,
    Forbidden,
    BadRequest
}

public class UpdateAgentProfileResult
{
    public AgentProfileCommandStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public AgentProfileResponseDto? Data { get; set; }

    public static UpdateAgentProfileResult Success(AgentProfileResponseDto data) =>
        new() { Status = AgentProfileCommandStatus.Success, Data = data };

    public static UpdateAgentProfileResult Forbidden(string message) =>
        new() { Status = AgentProfileCommandStatus.Forbidden, ErrorMessage = message };

    public static UpdateAgentProfileResult NotFound(string message) =>
        new() { Status = AgentProfileCommandStatus.NotFound, ErrorMessage = message };

    public static UpdateAgentProfileResult BadRequest(string message) =>
        new() { Status = AgentProfileCommandStatus.BadRequest, ErrorMessage = message };
}

public class UpdateAgentProfileCommandHandler : IRequestHandler<UpdateAgentProfileCommand, UpdateAgentProfileResult>
{
    private readonly IApplicationDbContext _context;

    public UpdateAgentProfileCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UpdateAgentProfileResult> Handle(UpdateAgentProfileCommand request, CancellationToken cancellationToken)
    {
        var isAgent = string.Equals(request.UserRole, "Agent", StringComparison.OrdinalIgnoreCase);
        var isAdmin = string.Equals(request.UserRole, "Admin", StringComparison.OrdinalIgnoreCase);

        if (!isAgent && !isAdmin)
        {
            return UpdateAgentProfileResult.Forbidden("Only users with Agent or Admin role can update agent profiles.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id.ToString() == request.CurrentUserId, cancellationToken);

        if (user == null)
        {
            return UpdateAgentProfileResult.NotFound($"User with ID {request.CurrentUserId} was not found.");
        }

        if (request.AgencyId.HasValue)
        {
            var agencyExists = await _context.Agencies.AnyAsync(a => a.Id == request.AgencyId.Value, cancellationToken);
            if (!agencyExists)
            {
                return UpdateAgentProfileResult.BadRequest($"Agency with ID {request.AgencyId.Value} was not found.");
            }
        }

        var profile = await _context.AgentProfiles
            .FirstOrDefaultAsync(ap => ap.UserId == user.Id.ToString(), cancellationToken);

        if (profile == null)
        {
            profile = new AgentProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id.ToString(),
                CreatedAt = DateTime.UtcNow
            };
            _context.AgentProfiles.Add(profile);
        }

        profile.Bio = request.Bio;
        profile.PublicPhone = request.PublicPhone;
        profile.AgencyId = request.AgencyId;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var fullName = $"{user.FirstName} {user.LastName}".Trim();

        var responseDto = new AgentProfileResponseDto
        {
            Id = user.Id.ToString(),
            Name = fullName,
            Bio = profile.Bio,
            PublicPhone = profile.PublicPhone,
            AgencyId = profile.AgencyId
        };

        return UpdateAgentProfileResult.Success(responseDto);
    }
}
