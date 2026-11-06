using Application.Common.Interfaces;
using Application.Inquiries.Dtos;
using Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Inquiries.Commands.UpdateInquiryStatus;


public enum UpdateInquiryStatusResultStatus
{
    Success,
    NotFound,
    Forbidden,
    BadRequest
}

public class UpdateInquiryStatusResult
{
    public UpdateInquiryStatusResultStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public ReceivedInquiryDto? Data { get; set; }
}

public record UpdateInquiryStatusCommand : IRequest<UpdateInquiryStatusResult>
{
    public Guid InquiryId { get; init; }
    public string Status { get; init; } = "New";
    public string? AgentNotes { get; init; }
    public string CurrentUserId { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
}

public class UpdateInquiryStatusCommandValidator : AbstractValidator<UpdateInquiryStatusCommand>
{
    private static readonly string[] AllowedStatuses = new[] { "New", "Contacted", "Closed" };

    public UpdateInquiryStatusCommandValidator()
    {
        RuleFor(v => v.Status)
            .NotEmpty()
            .Must(s => AllowedStatuses.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage("حالة الاستفسار غير صالحة. الحالات المتاحة: New, Contacted, Closed");

        RuleFor(v => v.AgentNotes)
            .MaximumLength(2000)
            .WithMessage("ملاحظات المالك يجب ألا تتجاوز 2000 حرف");
    }
}

public class UpdateInquiryStatusCommandHandler : IRequestHandler<UpdateInquiryStatusCommand, UpdateInquiryStatusResult>
{
    private readonly IApplicationDbContext _context;

    public UpdateInquiryStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UpdateInquiryStatusResult> Handle(UpdateInquiryStatusCommand request, CancellationToken cancellationToken)
    {
        var inquiry = await _context.PropertyInquiries
            .Include(i => i.Property)
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.Id == request.InquiryId, cancellationToken);

        if (inquiry == null)
        {
            return new UpdateInquiryStatusResult
            {
                Status = UpdateInquiryStatusResultStatus.NotFound,
                ErrorMessage = $"Inquiry with ID {request.InquiryId} was not found."
            };
        }

        // Check Property Ownership: Property.OwnerId == currentUserId or IsAdmin
        var isOwner = inquiry.Property != null && string.Equals(inquiry.Property.OwnerId, request.CurrentUserId, StringComparison.OrdinalIgnoreCase);

        if (!isOwner && !request.IsAdmin)
        {
            return new UpdateInquiryStatusResult
            {
                Status = UpdateInquiryStatusResultStatus.Forbidden,
                ErrorMessage = "غير مصرح لك بتعديل حالة استفسار لا يخص عقاراتك."
            };
        }

        if (!string.Equals(request.Status, inquiry.Status, StringComparison.OrdinalIgnoreCase))
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = inquiry.UserId.ToString(),
                Title = "تحديث حالة استفسارك",
                Message = $"تم تحديث حالة استفسارك لعقار {inquiry.Property?.Title ?? ""} إلى ({request.Status}).",
                Type = "InquiryStatusUpdated",
                ReferenceId = inquiry.Id.ToString(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
        }

        inquiry.Status = request.Status;
        inquiry.AgentNotes = request.AgentNotes;
        inquiry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new UpdateInquiryStatusResult
        {
            Status = UpdateInquiryStatusResultStatus.Success,
            Data = new ReceivedInquiryDto
            {
                Id = inquiry.Id,
                PropertyId = inquiry.PropertyId,
                PropertyTitle = inquiry.Property != null ? inquiry.Property.Title : string.Empty,
                UserId = inquiry.UserId,
                BuyerName = inquiry.User != null ? $"{inquiry.User.FirstName} {inquiry.User.LastName}".Trim() : string.Empty,
                PhoneNumber = inquiry.PhoneNumber,
                Message = inquiry.Message,
                Status = inquiry.Status,
                AgentNotes = inquiry.AgentNotes,
                CreatedAt = inquiry.CreatedAt,
                UpdatedAt = inquiry.UpdatedAt
            }
        };
    }
}
