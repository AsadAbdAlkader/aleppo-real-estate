namespace Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Role { get; }
    Guid? AgencyId { get; }
    IReadOnlyCollection<string> Permissions { get; }
    bool HasPermission(string permission);
    bool IsInRole(string role);
    bool IsAuthenticated { get; }
}
