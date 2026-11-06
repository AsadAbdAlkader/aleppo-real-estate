using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data;

public class ApplicationDbContextInitialiser
{
    private readonly ILogger<ApplicationDbContextInitialiser> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ApplicationDbContextInitialiser(
        ILogger<ApplicationDbContextInitialiser> logger,
        ApplicationDbContext context,
        IPasswordHasher passwordHasher)
    {
        _logger = logger;
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task InitialiseAsync()
    {
        try
        {
            var provider = _context.Database.ProviderName ?? "Unknown";
            _logger.LogInformation("Initialising database with provider: {Provider}", provider);

            if (_context.Database.IsSqlServer())
            {
                await _context.Database.MigrateAsync();
            }
            else
            {
                await _context.Database.EnsureCreatedAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initialising the database.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedUsersAsync();
            await TrySeedAgenciesAndAgentsAsync();
            await TrySeedPropertiesAsync();
            await TrySeedInquiriesAsync();
            await TrySeedChatMessagesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private async Task TrySeedUsersAsync()
    {
        if (await _context.Users.AnyAsync())
        {
            return;
        }

        var users = new List<User>
        {
            new User
            {
                Id = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66b111"),
                Email = "buyer@aleppo.com",
                PasswordHash = _passwordHasher.HashPassword("Password123!"),
                FirstName = "أحمد",
                LastName = "الحلبي",
                Role = "Buyer",
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new User
            {
                Id = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66b222"),
                Email = "agent@aleppo.com",
                PasswordHash = _passwordHasher.HashPassword("Password123!"),
                FirstName = "سامر",
                LastName = "العقاري",
                Role = "Agent",
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            }
        };

        _context.Users.AddRange(users);
        await _context.SaveChangesAsync();
    }

    private async Task TrySeedAgenciesAndAgentsAsync()
    {
        if (!await _context.Agencies.AnyAsync())
        {
            var agencies = new List<Agency>
            {
                new Agency
                {
                    Id = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66b333"),
                    Name = "مكتب تجريبي 01",
                    Description = "مكتب خدمات عقارية تجريبي بحلب.",
                    PhoneNumber = "+963212000001",
                    Address = "حي الشهباء - شارع التجربة",
                    CityArea = "الشهباء",
                    LogoUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
                    LicenseNumber = "ALE-DEMO-01",
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Agency
                {
                    Id = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66b444"),
                    Name = "مكتب تجريبي 02",
                    Description = "مكتب عقاري متقدم للتسويق والاستشارات العقارية.",
                    PhoneNumber = "+963212000002",
                    Address = "حي الفرقان - شارع الجامعة",
                    CityArea = "الفرقان",
                    LogoUrl = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
                    LicenseNumber = "ALE-DEMO-02",
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                }
            };

            _context.Agencies.AddRange(agencies);
            await _context.SaveChangesAsync();
        }

        if (!await _context.AgentProfiles.AnyAsync())
        {
            var agentUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "agent@aleppo.com");
            if (agentUser != null)
            {
                var agency1 = await _context.Agencies.FirstOrDefaultAsync(a => a.Name == "مكتب تجريبي 01");
                var agentProfile = new AgentProfile
                {
                    Id = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66c111"),
                    UserId = agentUser.Id.ToString(),
                    AgencyId = agency1?.Id,
                    Bio = "وكيل عقاري تجريبي متخصص في العقارات السكنية بحلب.",
                    PublicPhone = "+963911000001",
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                };

                _context.AgentProfiles.Add(agentProfile);
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task TrySeedPropertiesAsync()
    {
        if (await _context.Properties.AnyAsync())
        {
            return;
        }

        var properties = new List<Property>
        {
            new Property
            {
                Id = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
                OwnerId = "3fa85f64-5717-4562-b3fc-2c963f66b111",
                Title = "شقة فاخرة للبيع في حي الشهباء",
                Description = "شقة سكنية مميزة بتشطيبات عالية الجودة في أفضل أحياء حلب، إطلالة جبلية رائعة وقريبة من الخدمات.",
                Price = 250000.00m,
                Category = "Apartment",
                Purpose = "Sale",
                City = "حلب",
                CityArea = "الشهباء",
                Address = "شارع النيل - قرب الحديقة العامة",
                Bedrooms = 3,
                Bathrooms = 2,
                AreaSquareMeters = 180.5,
                ImageUrls = new List<string>
                {
                    "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                },
                Status = "Available",
                IsFeatured = true,
                Latitude = 36.2230,
                Longitude = 37.1320,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Property
            {
                Id = Guid.Parse("4a123f64-5717-4562-b3fc-2c963f66bba7"),
                OwnerId = "3fa85f64-5717-4562-b3fc-2c963f66b222",
                Title = "فيلا مستقلة مع حديقة في الفرقان",
                Description = "فيلا ممتازة مكونة من طابقين مع حديقة خاصة وكراج للسيارات في حي الفرقان الهادئ.",
                Price = 680000.00m,
                Category = "Villa",
                Purpose = "Sale",
                City = "حلب",
                CityArea = "الفرقان",
                Address = "شارع الجامعة - خلف كلية الهندسة",
                Bedrooms = 5,
                Bathrooms = 4,
                AreaSquareMeters = 450.0,
                ImageUrls = new List<string>
                {
                    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914"
                },
                Status = "Available",
                IsFeatured = true,
                Latitude = 36.2085,
                Longitude = 37.1180,
                CreatedAt = DateTime.UtcNow.AddDays(-8)
            },
            new Property
            {
                Id = Guid.Parse("5b234f64-5717-4562-b3fc-2c963f66ccb8"),
                OwnerId = "3fa85f64-5717-4562-b3fc-2c963f66b222",
                Title = "محل تجاري للاستثمار في العزيزية",
                Description = "محل تجاري ذو واجهة عريضة وموقع استراتيجي ممتاز يصلح لكافة الأنشطة التجارية.",
                Price = 190000.00m,
                Category = "Commercial",
                Purpose = "Rent",
                City = "حلب",
                CityArea = "العزيزية",
                Address = "شارع العزيزية الرئيسي - قرب ساحة العزيزية",
                Bedrooms = 0,
                Bathrooms = 1,
                AreaSquareMeters = 75.0,
                ImageUrls = new List<string>
                {
                    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d"
                },
                Status = "Available",
                IsFeatured = false,
                Latitude = 36.2135,
                Longitude = 37.1510,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Property
            {
                Id = Guid.Parse("6c345f64-5717-4562-b3fc-2c963f66ddc9"),
                OwnerId = "3fa85f64-5717-4562-b3fc-2c963f66b111",
                Title = "شقة واسعة في حي السبيل",
                Description = "شقة واسعة بالدور الأول مناسبة لعيادة أو مكتب شركة أو سكن عائلي راقٍ.",
                Price = 175000.00m,
                Category = "Apartment",
                Purpose = "Rent",
                City = "حلب",
                CityArea = "السبيل",
                Address = "شارع السبيل الرئيسي - بجانب جامع السبيل",
                Bedrooms = 4,
                Bathrooms = 2,
                AreaSquareMeters = 210.0,
                ImageUrls = new List<string>
                {
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
                },
                Status = "Available",
                IsFeatured = false,
                Latitude = 36.2200,
                Longitude = 37.1380,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new Property
            {
                Id = Guid.Parse("7d456f64-5717-4562-b3fc-2c963f66eed0"),
                OwnerId = "3fa85f64-5717-4562-b3fc-2c963f66b222",
                Title = "أرض معدة للبناء في المحافظة",
                Description = "قطعة أرض ممتازة بموقع استثماري واعد مرخصة للبناء السكني والتجاري.",
                Price = 520000.00m,
                Category = "Land",
                Purpose = "Sale",
                City = "حلب",
                CityArea = "المحافظة",
                Address = "منطقة المحافظة - قرب مبنى المحافظة",
                Bedrooms = 0,
                Bathrooms = 0,
                AreaSquareMeters = 600.0,
                ImageUrls = new List<string>
                {
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef"
                },
                Status = "Available",
                IsFeatured = true,
                Latitude = 36.2055,
                Longitude = 37.1340,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Property
            {
                Id = Guid.Parse("8e567f64-5717-4562-b3fc-2c963f66ffe1"),
                OwnerId = "3fa85f64-5717-4562-b3fc-2c963f66b111",
                Title = "عقار مؤرشف لا يظهر للمستخدمين",
                Description = "عقار تم أرشفته واختباره.",
                Price = 100000.00m,
                Category = "Apartment",
                Purpose = "Sale",
                City = "حلب",
                CityArea = "الشهباء",
                Address = "شارع الاختبار",
                Bedrooms = 2,
                Bathrooms = 1,
                AreaSquareMeters = 100.0,
                ImageUrls = new List<string>(),
                Status = "Archived",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            }
        };

        _context.Properties.AddRange(properties);
        await _context.SaveChangesAsync();
    }

    private async Task TrySeedInquiriesAsync()
    {
        if (await _context.PropertyInquiries.AnyAsync())
        {
            return;
        }

        var inquiry = new PropertyInquiry
        {
            Id = Guid.Parse("9f678f64-5717-4562-b3fc-2c963f66fff2"),
            PropertyId = Guid.Parse("4a123f64-5717-4562-b3fc-2c963f66bba7"),
            UserId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66b111"),
            Message = "مرحباً، هل الفيلا ما زالت متاحة للمعاينة؟",
            PhoneNumber = "+963933111222",
            Status = "New",
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        _context.PropertyInquiries.Add(inquiry);
        await _context.SaveChangesAsync();
    }

    private async Task TrySeedChatMessagesAsync()
    {
        if (await _context.ChatMessages.AnyAsync())
        {
            return;
        }

        var buyerId = "3fa85f64-5717-4562-b3fc-2c963f66b111";
        var agentId = "3fa85f64-5717-4562-b3fc-2c963f66b222";
        var propertyId = Guid.Parse("4a123f64-5717-4562-b3fc-2c963f66bba7");

        var chatMessages = new List<ChatMessage>
        {
            new ChatMessage
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                SenderId = buyerId,
                ReceiverId = agentId,
                PropertyId = propertyId,
                Message = "مرحباً، هل الفيلا في حي الفرقان ما زالت متاحة للمعاينة؟",
                IsRead = true,
                CreatedAt = DateTime.UtcNow.AddHours(-3)
            },
            new ChatMessage
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                SenderId = agentId,
                ReceiverId = buyerId,
                PropertyId = propertyId,
                Message = "أهلاً بك، نعم الفيلا متاحة ويمكننا تحديد موعد للمعاينة غداً.",
                IsRead = true,
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            },
            new ChatMessage
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                SenderId = buyerId,
                ReceiverId = agentId,
                PropertyId = propertyId,
                Message = "ممتاز، يناسبني الساعة الخامسة مساءً.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddHours(-1)
            }
        };

        _context.ChatMessages.AddRange(chatMessages);
        await _context.SaveChangesAsync();
    }
}
