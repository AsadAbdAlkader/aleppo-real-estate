using Application.Common.Interfaces;
using Application.Dashboard.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Dashboard.Queries.GetUserDashboard;

public record GetUserDashboardQuery(Guid UserId) : IRequest<DashboardDto?>;

public class GetUserDashboardQueryHandler : IRequestHandler<GetUserDashboardQuery, DashboardDto?>
{
    private readonly IApplicationDbContext _context;

    public GetUserDashboardQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto?> Handle(GetUserDashboardQuery request, CancellationToken cancellationToken)
    {
        var userIdStr = request.UserId.ToString();

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return null;
        }

        var userDto = new DashboardUserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role
        };

        var myPropertiesCount = await _context.Properties
            .AsNoTracking()
            .CountAsync(p => p.OwnerId == userIdStr, cancellationToken);

        var activePropertiesCount = await _context.Properties
            .AsNoTracking()
            .CountAsync(p => p.OwnerId == userIdStr && p.Status != "Archived", cancellationToken);

        var archivedPropertiesCount = await _context.Properties
            .AsNoTracking()
            .CountAsync(p => p.OwnerId == userIdStr && p.Status == "Archived", cancellationToken);

        var favoritesCount = await _context.FavoriteProperties
            .AsNoTracking()
            .CountAsync(f => f.UserId == request.UserId, cancellationToken);

        var myInquiriesCount = await _context.PropertyInquiries
            .AsNoTracking()
            .CountAsync(i => i.UserId == request.UserId, cancellationToken);

        var statsDto = new DashboardStatsDto
        {
            MyPropertiesCount = myPropertiesCount,
            ActivePropertiesCount = activePropertiesCount,
            ArchivedPropertiesCount = archivedPropertiesCount,
            FavoritesCount = favoritesCount,
            MyInquiriesCount = myInquiriesCount
        };

        var recentProperties = await _context.Properties
            .AsNoTracking()
            .Where(p => p.OwnerId == userIdStr)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .Select(p => new DashboardRecentPropertyDto
            {
                Id = p.Id,
                OwnerId = p.OwnerId,
                Title = p.Title,
                Price = p.Price,
                Category = p.Category,
                CityArea = p.CityArea,
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                ImageUrls = p.ImageUrls
            })
            .ToListAsync(cancellationToken);

        var recentFavorites = await _context.FavoriteProperties
            .AsNoTracking()
            .Where(f => f.UserId == request.UserId)
            .OrderByDescending(f => f.CreatedAt)
            .Take(5)
            .Select(f => new DashboardRecentFavoriteDto
            {
                Id = f.Property.Id,
                Title = f.Property.Title,
                Price = f.Property.Price,
                Category = f.Property.Category,
                CityArea = f.Property.CityArea,
                Status = f.Property.Status,
                ImageUrls = f.Property.ImageUrls
            })
            .ToListAsync(cancellationToken);

        var recentInquiries = await _context.PropertyInquiries
            .AsNoTracking()
            .Where(i => i.UserId == request.UserId)
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new DashboardRecentInquiryDto
            {
                Id = i.Id,
                PropertyId = i.PropertyId,
                PropertyTitle = i.Property != null ? i.Property.Title : string.Empty,
                Message = i.Message,
                PhoneNumber = i.PhoneNumber,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new DashboardDto
        {
            User = userDto,
            Stats = statsDto,
            RecentProperties = recentProperties,
            RecentFavorites = recentFavorites,
            RecentInquiries = recentInquiries
        };
    }
}
