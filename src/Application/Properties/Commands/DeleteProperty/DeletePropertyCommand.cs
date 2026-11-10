using Application.Common.Interfaces;
using Application.Common.Security;
using Application.Properties.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Commands.DeleteProperty;

public record DeletePropertyCommand(Guid Id, string CurrentUserId, bool IsAdmin, Guid? AgencyId = null)
    : IRequest<DeletePropertyResult>, IAgencyScopedRequest
{
    Guid? IAgencyScopedRequest.AgencyId => AgencyId;
}

public class DeletePropertyCommandHandler : IRequestHandler<DeletePropertyCommand, DeletePropertyResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext? _tenantContext;

    public DeletePropertyCommandHandler(IApplicationDbContext context, ITenantContext? tenantContext = null)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<DeletePropertyResult> Handle(DeletePropertyCommand request, CancellationToken cancellationToken)
    {
        var property = await _context.Properties
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (property == null)
        {
            return DeletePropertyResult.NotFound($"Property with ID {request.Id} was not found.");
        }

        if (_tenantContext != null)
        {
            await _tenantContext.EnsureValidAgencyContextAsync(cancellationToken);

            var isPlatformAdmin = _tenantContext.IsPlatformAdmin || request.IsAdmin;

            if (!isPlatformAdmin)
            {
                if (!_tenantContext.IsActiveMember || !_tenantContext.AgencyId.HasValue)
                {
                    return DeletePropertyResult.Forbidden("SEC-SCOPE-VIOLATION: Active agency membership required.");
                }

                if (property.AgencyId != _tenantContext.AgencyId.Value)
                {
                    return DeletePropertyResult.Forbidden("SEC-FORBIDDEN-AGENCY: Property belongs to another agency.");
                }

                var role = _tenantContext.AgencyRole ?? string.Empty;

                if (string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    // Authorized: Agency Owner / Admin can delete any property within their agency
                }
                else if (string.Equals(role, "Agent", StringComparison.OrdinalIgnoreCase))
                {
                    var isCreator = (property.CreatedByUserId.HasValue && property.CreatedByUserId.Value.ToString().Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase)) ||
                                    (!string.IsNullOrEmpty(property.OwnerId) && property.OwnerId.Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase));

                    if (!isCreator)
                    {
                        return DeletePropertyResult.Forbidden("SEC-FORBIDDEN-AGENT: Agents can only delete properties they created.");
                    }
                }
                else
                {
                    return DeletePropertyResult.Forbidden($"SEC-FORBIDDEN-ROLE: Members with role '{role}' cannot delete properties.");
                }
            }
        }
        else
        {
            var isOwner = !string.IsNullOrEmpty(property.OwnerId) &&
                          property.OwnerId.Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase);

            if (!isOwner && !request.IsAdmin)
            {
                return DeletePropertyResult.Forbidden("You do not have permission to delete this property.");
            }
        }

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync(cancellationToken);

        return DeletePropertyResult.Success();
    }
}
