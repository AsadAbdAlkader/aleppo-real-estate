using Application.Common.Interfaces;
using Application.Favorites.Dtos;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Favorites.Commands.AddFavorite;

public record AddFavoriteCommand(Guid UserId, Guid PropertyId) : IRequest<FavoriteResponseDto?>;

public class AddFavoriteCommandHandler : IRequestHandler<AddFavoriteCommand, FavoriteResponseDto?>
{
    private readonly IApplicationDbContext _context;

    public AddFavoriteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FavoriteResponseDto?> Handle(AddFavoriteCommand request, CancellationToken cancellationToken)
    {
        var propertyExists = await _context.Properties
            .AnyAsync(p => p.Id == request.PropertyId, cancellationToken);

        if (!propertyExists)
        {
            return null;
        }

        var existingFavorite = await _context.FavoriteProperties
            .FirstOrDefaultAsync(f => f.UserId == request.UserId && f.PropertyId == request.PropertyId, cancellationToken);

        if (existingFavorite == null)
        {
            var favorite = new FavoriteProperty
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                PropertyId = request.PropertyId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FavoriteProperties.Add(favorite);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new FavoriteResponseDto(request.PropertyId, true);
    }
}
