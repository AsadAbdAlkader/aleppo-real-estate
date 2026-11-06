using Application.Common.Interfaces;
using Application.Notifications.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Notifications.Queries.GetUnreadNotificationsCount;

public record GetUnreadNotificationsCountQuery(string CurrentUserId) : IRequest<UnreadCountDto>;

public class GetUnreadNotificationsCountQueryHandler : IRequestHandler<GetUnreadNotificationsCountQuery, UnreadCountDto>
{
    private readonly IApplicationDbContext _context;

    public GetUnreadNotificationsCountQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UnreadCountDto> Handle(GetUnreadNotificationsCountQuery request, CancellationToken cancellationToken)
    {
        var count = await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == request.CurrentUserId && !n.IsRead, cancellationToken);

        return new UnreadCountDto
        {
            UnreadCount = count
        };
    }
}
