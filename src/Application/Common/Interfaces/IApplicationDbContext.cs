using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Property> Properties { get; }
    DbSet<User> Users { get; }
    DbSet<FavoriteProperty> FavoriteProperties { get; }
    DbSet<PropertyInquiry> PropertyInquiries { get; }
    DbSet<Agency> Agencies { get; }
    DbSet<AgentProfile> AgentProfiles { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
