using Application.Common.Interfaces;
using Application.Inquiries.Dtos;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Inquiries.Commands.CreateInquiry;

public record CreateInquiryCommand : IRequest<InquiryDto?>
{
    public Guid UserId { get; init; }
    public Guid PropertyId { get; init; }
    public string Message { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
}

public class CreateInquiryCommandHandler : IRequestHandler<CreateInquiryCommand, InquiryDto?>
{
    private readonly IApplicationDbContext _context;

    public CreateInquiryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InquiryDto?> Handle(CreateInquiryCommand request, CancellationToken cancellationToken)
    {
        var property = await _context.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PropertyId, cancellationToken);

        if (property == null)
        {
            return null;
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        var inquiry = new PropertyInquiry
        {
            Id = Guid.NewGuid(),
            PropertyId = request.PropertyId,
            UserId = request.UserId,
            Message = request.Message,
            PhoneNumber = request.PhoneNumber,
            CreatedAt = DateTime.UtcNow
        };

        _context.PropertyInquiries.Add(inquiry);

        var userName = user != null
            ? $"{user.FirstName} {user.LastName}".Trim()
            : string.Empty;

        if (!string.IsNullOrEmpty(property.OwnerId))
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = property.OwnerId,
                Title = "استفسار جديد على عقارك",
                Message = $"لديك استفسار جديد حول عقارك {property.Title} من المستخدم {userName}.",
                Type = "InquiryReceived",
                ReferenceId = inquiry.Id.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new InquiryDto
        {
            Id = inquiry.Id,
            PropertyId = inquiry.PropertyId,
            PropertyTitle = property.Title,
            UserId = inquiry.UserId,
            UserName = userName,
            Message = inquiry.Message,
            PhoneNumber = inquiry.PhoneNumber,
            CreatedAt = inquiry.CreatedAt
        };
    }
}
