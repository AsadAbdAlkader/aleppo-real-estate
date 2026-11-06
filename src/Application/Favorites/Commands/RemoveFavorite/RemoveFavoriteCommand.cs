using Application.Common.Interfaces;
using Application.Favorites.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Favorites.Commands.RemoveFavorite;

public record RemoveFavoriteCommand(Guid UserId, Guid PropertyId) : IRequest<FavoriteResponseDto?>;

public class RemoveFavoriteCommandHandler : IRequestHandler<RemoveFavoriteCommand, FavoriteResponseDto?>
{
    private readonly IApplicationDbContext _context;

    public RemoveFavoriteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FavoriteResponseDto?> Handle(RemoveFavoriteCommand request, CancellationToken cancellationToken)
    {
        var propertyExists = await _context.Properties
            .AnyAsync(p => p.Id == request.PropertyId, cancellationToken);

        if (!propertyExists)
        {
            return null;
        }

        var favorite = await _context.FavoriteProperties
            .FirstOrDefaultAsync(f => f.UserId == request.UserId && f.PropertyId == request.PropertyId, cancellationToken);

        if (favorite != null)
        {
            _context.FavoriteProperties.Remove(favorite);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new FavoriteResponseDto(request.PropertyId, false);
    }
}
