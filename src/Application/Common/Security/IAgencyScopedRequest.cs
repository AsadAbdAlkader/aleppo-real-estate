namespace Application.Common.Security;

/// <summary>
/// Marks a MediatR request as scoped to a specific Real Estate Agency.
/// Used by AgencyScopeBehavior to enforce agency boundary isolation.
/// </summary>
public interface IAgencyScopedRequest
{
    Guid? AgencyId { get; }
}
