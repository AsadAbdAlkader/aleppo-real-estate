using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Common.Security;
using MediatR;

namespace Application.Common.Behaviors;

public class AgencyScopeBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;

    public AgencyScopeBehavior(ITenantContext tenantContext, ICurrentUserService currentUserService)
    {
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
    }

    public AgencyScopeBehavior(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
        _tenantContext = new FallbackTenantContext(currentUserService);
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (request is IAgencyScopedRequest scopedRequest)
        {
            await _tenantContext.EnsureValidAgencyContextAsync(cancellationToken);

            // Global access override for platform admins or privileged auditors
            if (_tenantContext.IsPlatformAdmin ||
                _currentUserService.HasPermission(Permissions.Property.GlobalAccess) ||
                _currentUserService.IsInRole("Admin"))
            {
                return await next();
            }

            if (!_tenantContext.IsActiveMember || !_tenantContext.AgencyId.HasValue)
            {
                throw new AgencyScopeViolationException(
                    "SEC-SCOPE-VIOLATION: Operation requires an active agency membership, but no valid agency context was established.");
            }

            var activeAgencyId = _tenantContext.AgencyId.Value;

            // If the request specifically targets an AgencyId, it MUST match the active agency context
            if (scopedRequest.AgencyId.HasValue && scopedRequest.AgencyId.Value != activeAgencyId)
            {
                throw new AgencyScopeViolationException(
                    $"SEC-SCOPE-VIOLATION: Operation targets agency '{scopedRequest.AgencyId.Value}', but user is acting under agency '{activeAgencyId}'.");
            }
        }

        return await next();
    }

    private class FallbackTenantContext : ITenantContext
    {
        private readonly ICurrentUserService _currentUserService;

        public FallbackTenantContext(ICurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
        }

        public Guid? AgencyId => _currentUserService.AgencyId;
        public string? AgencyRole => _currentUserService.Role;
        public bool IsActiveMember => _currentUserService.AgencyId.HasValue;
        public bool IsPlatformAdmin => _currentUserService.IsInRole("Admin") || _currentUserService.HasPermission(Permissions.Property.GlobalAccess);

        public Task<bool> EnsureValidAgencyContextAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(IsActiveMember || IsPlatformAdmin);
        }

        public void SetManualContext(Guid agencyId, string agencyRole, bool isPlatformAdmin = false) { }
    }
}
