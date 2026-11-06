using Domain.Entities;

namespace Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, Guid? agencyId = null, IEnumerable<string>? customPermissions = null);
}
