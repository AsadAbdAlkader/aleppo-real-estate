using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Infrastructure.Data;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Property> Properties => Set<Property>();
    public DbSet<User> Users => Set<User>();
    public DbSet<FavoriteProperty> FavoriteProperties => Set<FavoriteProperty>();
    public DbSet<PropertyInquiry> PropertyInquiries => Set<PropertyInquiry>();
    public DbSet<Agency> Agencies => Set<Agency>();
    public DbSet<AgentProfile> AgentProfiles => Set<AgentProfile>();
    public DbSet<AgencyMember> AgencyMembers => Set<AgencyMember>();
    public DbSet<AgencyInvitation> AgencyInvitations => Set<AgencyInvitation>();
    public DbSet<AgencySetting> AgencySettings => Set<AgencySetting>();
    public DbSet<PropertyImage> PropertyImages => Set<PropertyImage>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<AgencyAuditLog> AgencyAuditLogs => Set<AgencyAuditLog>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<AgencySubscription> AgencySubscriptions => Set<AgencySubscription>();
    public DbSet<PropertyTourBooking> PropertyTourBookings => Set<PropertyTourBooking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Users
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(u => u.Id);

            entity.Property(u => u.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.PasswordHash)
                .IsRequired();

            entity.Property(u => u.FirstName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(u => u.LastName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(u => u.PhoneNumber)
                .HasMaxLength(50)
                .IsRequired(false);

            entity.Property(u => u.PlatformRole)
                .HasMaxLength(30)
                .HasDefaultValue("User");

            entity.Property(u => u.Role)
                .HasMaxLength(50)
                .HasDefaultValue("Buyer");

            entity.Property(u => u.IsActive)
                .HasDefaultValue(true);

            entity.Property(u => u.EmailConfirmed)
                .HasDefaultValue(true);
        });

        // 2. Agencies
        modelBuilder.Entity<Agency>(entity =>
        {
            entity.ToTable("Agencies");
            entity.HasKey(a => a.Id);

            entity.Property(a => a.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(a => a.Slug)
                .HasMaxLength(200)
                .IsRequired(false);

            entity.HasIndex(a => a.Slug)
                .IsUnique();

            entity.Property(a => a.Description)
                .HasMaxLength(2000)
                .IsRequired(false);

            entity.Property(a => a.PhoneNumber)
                .HasMaxLength(50)
                .IsRequired(false);

            entity.Property(a => a.Email)
                .HasMaxLength(256)
                .IsRequired(false);

            entity.Property(a => a.Address)
                .HasMaxLength(500)
                .IsRequired(false);

            entity.Property(a => a.City)
                .HasMaxLength(100)
                .HasDefaultValue("حلب");

            entity.Property(a => a.CityArea)
                .HasMaxLength(100)
                .IsRequired(false);

            entity.Property(a => a.LogoUrl)
                .HasMaxLength(1000)
                .IsRequired(false);

            entity.Property(a => a.LicenseNumber)
                .HasMaxLength(100)
                .IsRequired(false);

            entity.HasOne(a => a.CreatedByUser)
                .WithMany()
                .HasForeignKey(a => a.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(a => a.Name)
                .HasDatabaseName("IX_Agencies_Name");

            entity.HasIndex(a => a.CityArea)
                .HasDatabaseName("IX_Agencies_CityArea");
        });

        // 3. AgencyMembers (N:M)
        modelBuilder.Entity<AgencyMember>(entity =>
        {
            entity.ToTable("AgencyMembers");
            entity.HasKey(m => m.Id);

            entity.HasIndex(m => new { m.AgencyId, m.UserId })
                .IsUnique()
                .HasDatabaseName("UQ_AgencyMembers_Agency_User");

            entity.HasOne(m => m.Agency)
                .WithMany(a => a.Members)
                .HasForeignKey(m => m.AgencyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                .WithMany(u => u.AgencyMemberships)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(m => m.Role)
                .HasMaxLength(30)
                .HasDefaultValue("Agent");

            entity.Property(m => m.MembershipStatus)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
        });

        // 4. AgentProfiles
        modelBuilder.Entity<AgentProfile>(entity =>
        {
            entity.ToTable("AgentProfiles");
            entity.HasKey(a => a.Id);

            entity.Property(a => a.UserId)
                .HasMaxLength(450)
                .IsRequired();

            entity.HasIndex(a => a.UserId)
                .IsUnique()
                .HasDatabaseName("IX_AgentProfiles_UserId");

            entity.HasOne(a => a.User)
                .WithOne()
                .HasForeignKey<AgentProfile>(a => a.UserGuid)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(a => a.AgencyId)
                .IsRequired(false);

            entity.HasIndex(a => a.AgencyId)
                .HasDatabaseName("IX_AgentProfiles_AgencyId");

            entity.HasOne(a => a.Agency)
                .WithMany(ag => ag.AgentProfiles)
                .HasForeignKey(a => a.AgencyId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(a => a.Bio)
                .HasMaxLength(2000)
                .IsRequired(false);

            entity.Property(a => a.PublicPhone)
                .HasMaxLength(50)
                .IsRequired(false);
        });

        // 5. AgencyInvitations
        modelBuilder.Entity<AgencyInvitation>(entity =>
        {
            entity.ToTable("AgencyInvitations");
            entity.HasKey(i => i.Id);

            entity.HasOne(i => i.Agency)
                .WithMany()
                .HasForeignKey(i => i.AgencyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(i => i.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.Property(i => i.Role)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(i => i.TokenHash)
                .IsRequired();
        });

        // 6. AgencySettings
        modelBuilder.Entity<AgencySetting>(entity =>
        {
            entity.ToTable("AgencySettings");
            entity.HasKey(s => s.Id);

            entity.HasIndex(s => s.AgencyId)
                .IsUnique();

            entity.HasOne(s => s.Agency)
                .WithOne(a => a.Settings)
                .HasForeignKey<AgencySetting>(s => s.AgencyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(s => s.PublicPhone).HasMaxLength(50);
            entity.Property(s => s.PublicEmail).HasMaxLength(256);
            entity.Property(s => s.WorkingHours).HasColumnType("jsonb");
            entity.Property(s => s.SocialLinks).HasColumnType("jsonb");
        });

        // 7. Properties
        modelBuilder.Entity<Property>(entity =>
        {
            entity.ToTable("Properties");
            entity.HasKey(p => p.Id);

            entity.HasOne(p => p.Agency)
                .WithMany(a => a.Properties)
                .HasForeignKey(p => p.AgencyId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(p => p.OwnerId)
                .HasMaxLength(450)
                .IsRequired(false);

            entity.HasIndex(p => p.OwnerId);

            entity.HasOne(p => p.Owner)
                .WithMany()
                .HasForeignKey(p => p.OwnerGuid)
                .IsRequired(false);

            entity.Property(p => p.Title)
                .HasMaxLength(250)
                .IsRequired();

            entity.Property(p => p.Description)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(p => p.Price)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(p => p.Currency)
                .HasMaxLength(10)
                .HasDefaultValue("SYP");

            entity.Property(p => p.Category)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(p => p.Purpose)
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("Sale");

            entity.Property(p => p.City)
                .HasMaxLength(100)
                .IsRequired()
                .HasDefaultValue("حلب");

            entity.Property(p => p.CityArea)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(p => p.District)
                .HasMaxLength(100)
                .IsRequired(false);

            entity.Property(p => p.Address)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(p => p.Status)
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("Available");

            entity.Property(p => p.IsFeatured)
                .HasDefaultValue(false);

            var stringListComparer = new ValueComparer<List<string>>(
                (c1, c2) => c1 != null && c2 != null ? c1.SequenceEqual(c2) : c1 == c2,
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList());

            entity.Property(p => p.ImageUrls)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>(),
                    stringListComparer
                );

            entity.HasIndex(p => new { p.AgencyId, p.Status, p.CreatedAt })
                .HasDatabaseName("IX_Properties_Agency_Status");

            entity.HasIndex(p => new { p.Category, p.Status })
                .HasDatabaseName("IX_Properties_Category_Status");

            entity.HasIndex(p => new { p.CityArea, p.Status })
                .HasDatabaseName("IX_Properties_CityArea_Status");

            entity.HasIndex(p => new { p.Purpose, p.Status })
                .HasDatabaseName("IX_Properties_Purpose_Status");

            entity.HasIndex(p => p.Price)
                .HasDatabaseName("IX_Properties_Price");

            entity.HasIndex(p => p.AreaSquareMeters)
                .HasDatabaseName("IX_Properties_AreaSquareMeters");

            entity.HasIndex(p => p.CreatedAt)
                .HasDatabaseName("IX_Properties_CreatedAt");
        });

        // 8. PropertyImages
        modelBuilder.Entity<PropertyImage>(entity =>
        {
            entity.ToTable("PropertyImages");
            entity.HasKey(pi => pi.Id);

            entity.HasOne(pi => pi.Property)
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(pi => pi.ImageUrl)
                .IsRequired();
        });

        // 9. FavoriteProperties
        modelBuilder.Entity<FavoriteProperty>(entity =>
        {
            entity.ToTable("FavoriteProperties");
            entity.HasKey(f => f.Id);

            entity.HasIndex(f => new { f.UserId, f.PropertyId })
                .IsUnique();

            entity.HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.Property)
                .WithMany()
                .HasForeignKey(f => f.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 10. PropertyInquiries
        modelBuilder.Entity<PropertyInquiry>(entity =>
        {
            entity.ToTable("PropertyInquiries");
            entity.HasKey(i => i.Id);

            entity.Property(i => i.Message)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(i => i.PhoneNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.Ignore(i => i.CustomerName);
            entity.Ignore(i => i.CustomerEmail);
            entity.Ignore(i => i.CustomerPhone);

            entity.Property(i => i.Status)
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("New");

            entity.Property(i => i.AgentNotes)
                .HasMaxLength(2000)
                .IsRequired(false);

            entity.HasOne(i => i.User)
                .WithMany()
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.Property)
                .WithMany()
                .HasForeignKey(i => i.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.Agency)
                .WithMany()
                .HasForeignKey(i => i.AgencyId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(i => i.AssignedToUser)
                .WithMany()
                .HasForeignKey(i => i.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 11. Conversations
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.ToTable("Conversations");
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.Agency)
                .WithMany()
                .HasForeignKey(c => c.AgencyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Property)
                .WithMany()
                .HasForeignKey(c => c.PropertyId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 12. ConversationParticipants
        modelBuilder.Entity<ConversationParticipant>(entity =>
        {
            entity.ToTable("ConversationParticipants");
            entity.HasKey(cp => cp.Id);

            entity.HasIndex(cp => new { cp.ConversationId, cp.UserId })
                .IsUnique();

            entity.HasOne(cp => cp.Conversation)
                .WithMany(c => c.Participants)
                .HasForeignKey(cp => cp.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cp => cp.User)
                .WithMany()
                .HasForeignKey(cp => cp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 13. ChatMessages
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("ChatMessages");
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.Conversation)
                .WithMany(cv => cv.Messages)
                .HasForeignKey(c => c.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(c => c.SenderId)
                .HasMaxLength(450)
                .IsRequired();

            entity.HasOne(c => c.Sender)
                .WithMany()
                .HasForeignKey(c => c.SenderGuid)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(c => c.ReceiverId)
                .HasMaxLength(450)
                .IsRequired();

            entity.HasOne(c => c.Receiver)
                .WithMany()
                .HasForeignKey(c => c.ReceiverGuid)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(c => c.PropertyId)
                .IsRequired(false);

            entity.HasOne(c => c.Property)
                .WithMany()
                .HasForeignKey(c => c.PropertyId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(c => c.Message)
                .HasMaxLength(4000)
                .IsRequired();

            entity.Property(c => c.MessageType)
                .HasMaxLength(30)
                .HasDefaultValue("Text");

            entity.Property(c => c.IsRead)
                .HasDefaultValue(false);

            entity.HasIndex(c => new { c.SenderId, c.ReceiverId })
                .HasDatabaseName("IX_ChatMessages_SenderId_ReceiverId");

            entity.HasIndex(c => new { c.ReceiverId, c.IsRead })
                .HasDatabaseName("IX_ChatMessages_ReceiverId_IsRead");
        });

        // 14. Notifications
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");
            entity.HasKey(n => n.Id);

            entity.Property(n => n.UserId)
                .HasMaxLength(450)
                .IsRequired();

            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserGuid)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Agency)
                .WithMany()
                .HasForeignKey(n => n.AgencyId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(n => n.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(n => n.Message)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(n => n.Type)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(n => n.ReferenceType)
                .HasMaxLength(50);

            entity.Property(n => n.ReferenceId)
                .HasMaxLength(450)
                .IsRequired(false);

            entity.Property(n => n.IsRead)
                .HasDefaultValue(false);

            entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt })
                .HasDatabaseName("IX_Notifications_UserId_IsRead_CreatedAt");
        });

        // 15. AgencyAuditLogs
        modelBuilder.Entity<AgencyAuditLog>(entity =>
        {
            entity.ToTable("AgencyAuditLogs");
            entity.HasKey(al => al.Id);

            entity.HasOne(al => al.Agency)
                .WithMany()
                .HasForeignKey(al => al.AgencyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(al => al.User)
                .WithMany()
                .HasForeignKey(al => al.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(al => al.Action).HasMaxLength(100).IsRequired();
            entity.Property(al => al.EntityName).HasMaxLength(100).IsRequired();
            entity.Property(al => al.OldValues).HasColumnType("jsonb");
            entity.Property(al => al.NewValues).HasColumnType("jsonb");
            entity.Property(al => al.IpAddress).HasMaxLength(45);

            entity.HasIndex(al => new { al.AgencyId, al.CreatedAt });
        });

        // 16. SubscriptionPlans
        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.ToTable("SubscriptionPlans");
            entity.HasKey(sp => sp.Id);

            entity.Property(sp => sp.Name).HasMaxLength(100).IsRequired();
            entity.Property(sp => sp.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(sp => sp.Code).IsUnique();

            entity.Property(sp => sp.MonthlyPrice).HasColumnType("decimal(18,2)");
            entity.Property(sp => sp.YearlyPrice).HasColumnType("decimal(18,2)");
            entity.Property(sp => sp.Features).HasColumnType("jsonb");
        });

        // 17. AgencySubscriptions
        modelBuilder.Entity<AgencySubscription>(entity =>
        {
            entity.ToTable("AgencySubscriptions");
            entity.HasKey(s => s.Id);

            entity.HasOne(s => s.Agency)
                .WithMany(a => a.Subscriptions)
                .HasForeignKey(s => s.AgencyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Plan)
                .WithMany()
                .HasForeignKey(s => s.PlanId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(s => s.Status).HasMaxLength(30).HasDefaultValue("Active");

            entity.HasIndex(s => s.AgencyId);
        });
    }
}
