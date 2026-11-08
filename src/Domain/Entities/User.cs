using Domain.Common;

namespace Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string PlatformRole { get; set; } = "User"; // PlatformAdmin, User
    public string Role { get; set; } = "Buyer"; // Legacy role compatibility
    public bool IsActive { get; set; } = true;
    public bool EmailConfirmed { get; set; } = true;

    public ICollection<AgencyMember> AgencyMemberships { get; set; } = new List<AgencyMember>();
}
