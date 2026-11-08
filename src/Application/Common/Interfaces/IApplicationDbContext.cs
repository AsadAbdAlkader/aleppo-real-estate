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
    DbSet<AgencyMember> AgencyMembers { get; }
    DbSet<AgencyInvitation> AgencyInvitations { get; }
    DbSet<AgencySetting> AgencySettings { get; }
    DbSet<PropertyImage> PropertyImages { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<ConversationParticipant> ConversationParticipants { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<AgencyAuditLog> AgencyAuditLogs { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<AgencySubscription> AgencySubscriptions { get; }
    DbSet<PropertyTourBooking> PropertyTourBookings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
