using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Common.Security;
using MediatR;

namespace Application.Common.Behaviors;

public class AgencyScopeBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICurrentUserService _currentUserService;

    public AgencyScopeBehavior(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (request is IAgencyScopedRequest scopedRequest && scopedRequest.AgencyId.HasValue)
        {
            // Global access override for platform admins or privileged auditors
            if (_currentUserService.HasPermission(Permissions.Property.GlobalAccess) || 
                _currentUserService.IsInRole("Admin"))
            {
                return await next();
            }

            var targetAgencyId = scopedRequest.AgencyId.Value;
            var userAgencyId = _currentUserService.AgencyId;

            if (!userAgencyId.HasValue || userAgencyId.Value != targetAgencyId)
            {
                throw new AgencyScopeViolationException(
                    $"SEC-SCOPE-VIOLATION: Operation targets agency '{targetAgencyId}', but user is assigned to '{userAgencyId?.ToString() ?? "None"}'.");
            }
        }

        return await next();
    }
}
