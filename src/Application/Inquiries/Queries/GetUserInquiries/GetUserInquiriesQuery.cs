using Application.Common.Interfaces;
using Application.Inquiries.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Inquiries.Queries.GetUserInquiries;

public record GetUserInquiriesQuery(Guid UserId) : IRequest<List<InquiryDto>>;

public class GetUserInquiriesQueryHandler : IRequestHandler<GetUserInquiriesQuery, List<InquiryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUserInquiriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<InquiryDto>> Handle(GetUserInquiriesQuery request, CancellationToken cancellationToken)
    {
        var inquiries = await _context.PropertyInquiries
            .AsNoTracking()
            .Where(i => i.UserId == request.UserId)
            .Include(i => i.Property)
            .Include(i => i.User)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InquiryDto
            {
                Id = i.Id,
                PropertyId = i.PropertyId,
                PropertyTitle = i.Property != null ? i.Property.Title : string.Empty,
                UserId = i.UserId,
                UserName = i.User != null ? $"{i.User.FirstName} {i.User.LastName}".Trim() : string.Empty,
                Message = i.Message,
                PhoneNumber = i.PhoneNumber,
                Status = i.Status,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return inquiries;
    }
}
