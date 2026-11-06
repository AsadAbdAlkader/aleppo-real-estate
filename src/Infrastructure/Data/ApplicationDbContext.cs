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
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<PropertyTourBooking> PropertyTourBookings => Set<PropertyTourBooking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Property>(entity =>
        {
            entity.ToTable("Properties");
            entity.HasKey(p => p.Id);

            entity.Property(p => p.OwnerId)
                .HasMaxLength(450)
                .IsRequired(false);

            entity.HasIndex(p => p.OwnerId);

            entity.HasOne(p => p.Owner)
                .WithMany()
                .HasForeignKey(p => p.OwnerGuid)
                .IsRequired(false);

            entity.Property(p => p.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(p => p.Description)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(p => p.Price)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

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

            entity.Property(p => p.Address)
                .HasMaxLength(300)
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

            entity.Property(u => u.Role)
                .HasMaxLength(50)
                .IsRequired()
                .HasDefaultValue("Buyer");
        });

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
        });

        modelBuilder.Entity<Agency>(entity =>
        {
            entity.ToTable("Agencies");
            entity.HasKey(a => a.Id);

            entity.Property(a => a.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(a => a.Description)
                .HasMaxLength(2000)
                .IsRequired(false);

            entity.Property(a => a.PhoneNumber)
                .HasMaxLength(50)
                .IsRequired(false);

            entity.Property(a => a.Address)
                .HasMaxLength(300)
                .IsRequired(false);

            entity.Property(a => a.CityArea)
                .HasMaxLength(100)
                .IsRequired(false);

            entity.Property(a => a.LogoUrl)
                .HasMaxLength(1000)
                .IsRequired(false);

            entity.Property(a => a.LicenseNumber)
                .HasMaxLength(100)
                .IsRequired(false);

            entity.HasIndex(a => a.Name)
                .HasDatabaseName("IX_Agencies_Name");

            entity.HasIndex(a => a.CityArea)
                .HasDatabaseName("IX_Agencies_CityArea");
        });

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
                .IsRequired(false);

            entity.Property(n => n.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(n => n.Message)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(n => n.Type)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(n => n.ReferenceId)
                .HasMaxLength(450)
                .IsRequired(false);

            entity.Property(n => n.IsRead)
                .HasDefaultValue(false);

            entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt })
                .HasDatabaseName("IX_Notifications_UserId_IsRead_CreatedAt");
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("ChatMessages");
            entity.HasKey(c => c.Id);

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

            entity.Property(c => c.IsRead)
                .HasDefaultValue(false);

            entity.HasIndex(c => new { c.SenderId, c.ReceiverId })
                .HasDatabaseName("IX_ChatMessages_SenderId_ReceiverId");

            entity.HasIndex(c => new { c.ReceiverId, c.IsRead })
                .HasDatabaseName("IX_ChatMessages_ReceiverId_IsRead");
        });
    }
}
