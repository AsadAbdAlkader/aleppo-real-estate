using System.Reflection;
using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Common.Security;
using MediatR;

namespace Application.Common.Behaviors;

public class AuthorizationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICurrentUserService _currentUserService;

    public AuthorizationBehavior(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var authorizeAttributes = request.GetType().GetCustomAttributes<AuthorizeAttribute>().ToList();

        if (!authorizeAttributes.Any())
        {
            return await next();
        }

        // 1. Must be authenticated
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("Authentication is required to perform this action.");
        }

        // 2. Role-based checks
        var authorizeAttributesWithRoles = authorizeAttributes.Where(a => !string.IsNullOrWhiteSpace(a.Roles));
        foreach (var roles in authorizeAttributesWithRoles.Select(a => a.Roles.Split(',')))
        {
            var authorized = roles.Any(role => _currentUserService.IsInRole(role.Trim()));
            if (!authorized)
            {
                throw new ForbiddenAccessException("User does not have any of the required roles.");
            }
        }

        // 3. Policy / Permission-based checks
        var authorizeAttributesWithPolicies = authorizeAttributes.Where(a => !string.IsNullOrWhiteSpace(a.Policy));
        foreach (var policy in authorizeAttributesWithPolicies.Select(a => a.Policy))
        {
            if (policy.StartsWith("Permission:", StringComparison.OrdinalIgnoreCase))
            {
                var requiredPermission = policy.Substring("Permission:".Length).Trim();
                if (!_currentUserService.HasPermission(requiredPermission))
                {
                    throw new ForbiddenAccessException($"User lacks the required permission: {requiredPermission}");
                }
            }
            else
            {
                // Fallback direct permission match
                if (!_currentUserService.HasPermission(policy))
                {
                    throw new ForbiddenAccessException($"User does not satisfy policy: {policy}");
                }
            }
        }

        return await next();
    }
}
