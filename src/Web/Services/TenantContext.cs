using System.Security.Claims;
using Application.Common.Interfaces;
using Application.Common.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Web.Services;

public class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IApplicationDbContext _context;

    private bool _resolved = false;
    private Guid? _agencyId;
    private string? _agencyRole;
    private bool _isActiveMember;
    private bool _isPlatformAdmin;

    public TenantContext(IHttpContextAccessor httpContextAccessor, IApplicationDbContext context)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
    }

    public Guid? AgencyId => _agencyId;
    public string? AgencyRole => _agencyRole;
    public bool IsActiveMember => _isActiveMember;
    public bool IsPlatformAdmin => _isPlatformAdmin;

    public async Task<bool> EnsureValidAgencyContextAsync(CancellationToken cancellationToken = default)
    {
        if (_resolved)
        {
            return _isActiveMember;
        }

        var httpContext = _httpContextAccessor.HttpContext;
        var user = httpContext?.User;

        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            _resolved = true;
            _agencyId = null;
            _agencyRole = null;
            _isActiveMember = false;
            _isPlatformAdmin = false;
            return false;
        }

        var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userGuid))
        {
            _resolved = true;
            return false;
        }

        var roleClaim = user.FindFirstValue(ClaimTypes.Role) ?? user.FindFirstValue("role");
        _isPlatformAdmin = string.Equals(roleClaim, "Admin", StringComparison.OrdinalIgnoreCase) ||
                           user.HasClaim(Permissions.ClaimType, Permissions.Property.GlobalAccess);

        // 1. Identify requested agency (Header takes precedence, fallback to JWT claim)
        Guid? requestedAgencyId = null;

        if (httpContext?.Request?.Headers != null &&
            httpContext.Request.Headers.TryGetValue("X-Agency-Id", out var headerVal))
        {
            if (Guid.TryParse(headerVal.ToString(), out var headerGuid))
            {
                requestedAgencyId = headerGuid;
            }
        }

        if (!requestedAgencyId.HasValue)
        {
            var agencyClaim = user.FindFirstValue("agency_id");
            if (!string.IsNullOrEmpty(agencyClaim) && Guid.TryParse(agencyClaim, out var claimGuid))
            {
                requestedAgencyId = claimGuid;
            }
        }

        // 2. Validate membership against database (Never trust X-Agency-Id or claims blindly)
        if (requestedAgencyId.HasValue)
        {
            var member = await _context.AgencyMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.AgencyId == requestedAgencyId.Value &&
                                          m.UserId == userGuid &&
                                          m.MembershipStatus == "Active", cancellationToken);

            if (member != null)
            {
                _agencyId = requestedAgencyId.Value;
                _agencyRole = member.Role;
                _isActiveMember = true;
            }
            else
            {
                // FAIL CLOSED: User requested an agency where they hold no Active membership
                // Never allow X-Agency-Id to bypass membership validation
                _agencyId = null;
                _agencyRole = null;
                _isActiveMember = false;
            }
        }
        else
        {
            // If no explicit agency was requested, check active memberships
            var activeMemberships = await _context.AgencyMembers
                .AsNoTracking()
                .Where(m => m.UserId == userGuid && m.MembershipStatus == "Active")
                .ToListAsync(cancellationToken);

            if (activeMemberships.Count >= 1)
            {
                _agencyId = activeMemberships[0].AgencyId;
                _agencyRole = activeMemberships[0].Role;
                _isActiveMember = true;
            }
            else if (_isPlatformAdmin)
            {
                var anyAgency = await _context.Agencies.Select(a => a.Id).FirstOrDefaultAsync(cancellationToken);
                if (anyAgency != Guid.Empty)
                {
                    _agencyId = anyAgency;
                    _agencyRole = "Admin";
                    _isActiveMember = true;
                }
                else
                {
                    _agencyId = null;
                    _agencyRole = null;
                    _isActiveMember = false;
                }
            }
            else
            {
                // Unassociated user (0 agencies) -> FAIL CLOSED until agency context is established
                _agencyId = null;
                _agencyRole = null;
                _isActiveMember = false;
            }
        }

        _resolved = true;
        return _isActiveMember;
    }

    public void SetManualContext(Guid agencyId, string agencyRole, bool isPlatformAdmin = false)
    {
        _agencyId = agencyId;
        _agencyRole = agencyRole;
        _isActiveMember = true;
        _isPlatformAdmin = isPlatformAdmin;
        _resolved = true;
    }
}
