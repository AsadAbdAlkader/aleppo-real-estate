using Application.Common.Interfaces;
using Application.Inquiries.Dtos;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Inquiries.Queries.GetReceivedInquiries;

public record GetReceivedInquiriesQuery : IRequest<PaginatedList<ReceivedInquiryDto>>
{
    public string OwnerUserId { get; init; } = string.Empty;
    public string? Status { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class GetReceivedInquiriesQueryHandler : IRequestHandler<GetReceivedInquiriesQuery, PaginatedList<ReceivedInquiryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext? _tenantContext;

    public GetReceivedInquiriesQueryHandler(IApplicationDbContext context, ITenantContext? tenantContext = null)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<PaginatedList<ReceivedInquiryDto>> Handle(GetReceivedInquiriesQuery request, CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        if (_tenantContext != null)
        {
            await _tenantContext.EnsureValidAgencyContextAsync(cancellationToken);
        }

        var query = _context.PropertyInquiries
            .AsNoTracking()
            .Where(i => i.Property != null);

        if (_tenantContext?.AgencyId.HasValue == true)
        {
            var agencyId = _tenantContext.AgencyId.Value;
            query = query.Where(i => i.AgencyId == agencyId || i.Property!.AgencyId == agencyId || i.Property!.OwnerId == request.OwnerUserId);
        }
        else
        {
            query = query.Where(i => i.Property!.OwnerId == request.OwnerUserId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var status = request.Status.Trim();
            query = query.Where(i => i.Status == status);
        }

        var projected = query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new ReceivedInquiryDto
            {
                Id = i.Id,
                PropertyId = i.PropertyId,
                PropertyTitle = i.Property != null ? i.Property.Title : string.Empty,
                UserId = i.UserId,
                BuyerName = i.User != null ? $"{i.User.FirstName} {i.User.LastName}".Trim() : string.Empty,
                PhoneNumber = i.PhoneNumber,
                Message = i.Message,
                Status = i.Status,
                AgentNotes = i.AgentNotes,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            });

        return await PaginatedList<ReceivedInquiryDto>.CreateAsync(projected, pageNumber, pageSize, cancellationToken);
    }
}
