using Application.Common.Interfaces;
using Application.Tours.Dtos;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Tours.Commands.BookTour;

public record BookTourCommand : IRequest<TourBookingDto>
{
    public Guid PropertyId { get; init; }
    public string BuyerId { get; init; } = string.Empty;
    public string BuyerName { get; init; } = string.Empty;
    public string BuyerPhone { get; init; } = string.Empty;
    public DateTime TourDate { get; init; }
    public string TourType { get; init; } = "InPerson";
    public string? Notes { get; init; }
}

public class BookTourCommandHandler : IRequestHandler<BookTourCommand, TourBookingDto>
{
    private readonly IApplicationDbContext _context;

    public BookTourCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TourBookingDto> Handle(BookTourCommand request, CancellationToken cancellationToken)
    {
        var property = await _context.Properties
            .Include(p => p.Owner)
            .FirstOrDefaultAsync(p => p.Id == request.PropertyId, cancellationToken);

        if (property == null || string.Equals(property.Status, "Archived", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Property '{request.PropertyId}' is not available for touring.");
        }

        var booking = new PropertyTourBooking
        {
            Id = Guid.NewGuid(),
            PropertyId = property.Id,
            BuyerId = request.BuyerId,
            BuyerName = request.BuyerName.Trim(),
            BuyerPhone = request.BuyerPhone.Trim(),
            TourDate = request.TourDate,
            TourType = string.Equals(request.TourType, "VideoCall", StringComparison.OrdinalIgnoreCase) ? "VideoCall" : "InPerson",
            Status = "Pending",
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.PropertyTourBookings.Add(booking);

        // Notify property owner of the tour request
        if (!string.IsNullOrEmpty(property.OwnerId) && Guid.TryParse(property.OwnerId, out var ownerGuid))
        {
            var tourTypeAr = booking.TourType == "VideoCall" ? "معاينة افتراضية عبر الفيديو" : "معاينة ميدانية شخصية";
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = property.OwnerId,
                UserGuid = ownerGuid,
                Title = "طلب حجز معاينة جديد",
                Message = $"طلب {booking.BuyerName} حجز {tourTypeAr} للعقار '{property.Title}' بتاريخ {booking.TourDate:yyyy/MM/dd}.",
                Type = "TourBooking",
                ReferenceId = booking.Id.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new TourBookingDto
        {
            Id = booking.Id,
            PropertyId = property.Id,
            PropertyTitle = property.Title,
            PropertyAddress = property.Address,
            PropertyPrice = property.Price,
            PropertyImageUrl = property.ImageUrls.FirstOrDefault(),
            BuyerId = booking.BuyerId,
            BuyerName = booking.BuyerName,
            BuyerPhone = booking.BuyerPhone,
            TourDate = booking.TourDate,
            TourType = booking.TourType,
            Status = booking.Status,
            Notes = booking.Notes,
            CreatedAt = booking.CreatedAt
        };
    }
}
