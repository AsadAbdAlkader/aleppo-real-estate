namespace Application.Common.Interfaces;

/// <summary>
/// Abstraction for resolving and enforcing the active Agency / Tenant context
/// for the current authenticated request in Aleppo Real Estate SaaS.
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// The validated active Agency ID for the current request.
    /// Returns null if no active agency context is established.
    /// </summary>
    Guid? AgencyId { get; }

    /// <summary>
    /// The user's role within the active agency from AgencyMembers
    /// (e.g. "Owner", "Admin", "Agent", "Employee", "Viewer").
    /// </summary>
    string? AgencyRole { get; }

    /// <summary>
    /// Indicates whether the current user holds an Active membership in the resolved agency.
    /// </summary>
    bool IsActiveMember { get; }

    /// <summary>
    /// Indicates whether the current user is operating under an audited platform administrator override.
    /// </summary>
    bool IsPlatformAdmin { get; }

    /// <summary>
    /// Asynchronously resolves and validates the tenant context from HTTP headers,
    /// JWT claims, and database membership records. Fails closed if unauthorized.
    /// </summary>
    Task<bool> EnsureValidAgencyContextAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Explicitly sets the tenant context. Useful for unit tests or background workers.
    /// </summary>
    void SetManualContext(Guid agencyId, string agencyRole, bool isPlatformAdmin = false);
}
