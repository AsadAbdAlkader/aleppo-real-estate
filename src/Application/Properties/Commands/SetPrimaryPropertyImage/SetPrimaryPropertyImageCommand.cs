using Application.Common.Interfaces;
using Application.Properties.Dtos;
using Application.Properties.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Commands.SetPrimaryPropertyImage;

public record SetPrimaryPropertyImageCommand(Guid PropertyId, string ImageUrl, string CurrentUserId, bool IsAdmin)
    : IRequest<PropertyImageResult>;

public class SetPrimaryPropertyImageCommandHandler : IRequestHandler<SetPrimaryPropertyImageCommand, PropertyImageResult>
{
    private readonly IApplicationDbContext _context;

    public SetPrimaryPropertyImageCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PropertyImageResult> Handle(SetPrimaryPropertyImageCommand request, CancellationToken cancellationToken)
    {
        var property = await _context.Properties
            .FirstOrDefaultAsync(p => p.Id == request.PropertyId, cancellationToken);

        if (property == null)
        {
            return PropertyImageResult.NotFound($"Property with ID {request.PropertyId} was not found.");
        }

        var isOwner = !string.IsNullOrEmpty(property.OwnerId) &&
                      property.OwnerId.Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase);

        if (!isOwner && !request.IsAdmin)
        {
            return PropertyImageResult.Forbidden("You do not have permission to modify images for this property.");
        }

        var updatedUrls = new List<string>(property.ImageUrls ?? new List<string>());
        var existingImage = updatedUrls.FirstOrDefault(url =>
            string.Equals(url, request.ImageUrl, StringComparison.OrdinalIgnoreCase));

        if (existingImage == null)
        {
            return PropertyImageResult.NotFound($"Image URL '{request.ImageUrl}' was not found for property ID {request.PropertyId}.");
        }

        // Move target image URL to index 0
        updatedUrls.RemoveAll(url =>
            string.Equals(url, request.ImageUrl, StringComparison.OrdinalIgnoreCase));

        updatedUrls.Insert(0, existingImage);

        property.ImageUrls = updatedUrls;
        property.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new ImageUploadResponseDto
        {
            PropertyId = property.Id,
            ImageUrls = property.ImageUrls,
            PrimaryImageUrl = property.ImageUrls.FirstOrDefault()
        };

        return PropertyImageResult.Success(dto);
    }
}
