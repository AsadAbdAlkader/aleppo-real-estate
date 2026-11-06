using Application.Common.Interfaces;
using Application.Tours.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Tours.Queries.GetMyTours;

public record GetMyToursQuery : IRequest<List<TourBookingDto>>
{
    public string UserId { get; init; } = string.Empty;
}

public class GetMyToursQueryHandler : IRequestHandler<GetMyToursQuery, List<TourBookingDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyToursQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TourBookingDto>> Handle(GetMyToursQuery request, CancellationToken cancellationToken)
    {
        return await _context.PropertyTourBookings
            .AsNoTracking()
            .Include(t => t.Property)
            .Where(t => t.BuyerId == request.UserId || (t.Property != null && t.Property.OwnerId == request.UserId))
            .OrderByDescending(t => t.TourDate)
            .Select(t => new TourBookingDto
            {
                Id = t.Id,
                PropertyId = t.PropertyId,
                PropertyTitle = t.Property != null ? t.Property.Title : string.Empty,
                PropertyAddress = t.Property != null ? t.Property.Address : string.Empty,
                PropertyPrice = t.Property != null ? t.Property.Price : 0,
                PropertyImageUrl = t.Property != null ? t.Property.ImageUrls.FirstOrDefault() : null,
                BuyerId = t.BuyerId,
                BuyerName = t.BuyerName,
                BuyerPhone = t.BuyerPhone,
                TourDate = t.TourDate,
                TourType = t.TourType,
                Status = t.Status,
                Notes = t.Notes,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
