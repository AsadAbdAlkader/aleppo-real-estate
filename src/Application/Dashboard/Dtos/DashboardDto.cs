namespace Application.Dashboard.Dtos;

public class DashboardDto
{
    public DashboardUserDto User { get; set; } = null!;
    public DashboardStatsDto Stats { get; set; } = null!;
    public List<DashboardRecentPropertyDto> RecentProperties { get; set; } = new();
    public List<DashboardRecentFavoriteDto> RecentFavorites { get; set; } = new();
    public List<DashboardRecentInquiryDto> RecentInquiries { get; set; } = new();
}
