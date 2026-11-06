using Application.Common.Interfaces;
using Application.Properties.Dtos;
using Application.Properties.Models;
using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Commands.DeletePropertyImage;

public record DeletePropertyImageCommand(Guid PropertyId, string ImageUrl, string CurrentUserId, bool IsAdmin)
    : IRequest<PropertyImageResult>;

public class DeletePropertyImageCommandHandler : IRequestHandler<DeletePropertyImageCommand, PropertyImageResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public DeletePropertyImageCommandHandler(IApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<PropertyImageResult> Handle(DeletePropertyImageCommand request, CancellationToken cancellationToken)
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
            return PropertyImageResult.Forbidden("You do not have permission to delete images for this property.");
        }

        var updatedUrls = new List<string>(property.ImageUrls ?? new List<string>());
        var existingImage = updatedUrls.FirstOrDefault(url =>
            string.Equals(url, request.ImageUrl, StringComparison.OrdinalIgnoreCase));

        if (existingImage == null)
        {
            return PropertyImageResult.NotFound($"Image URL '{request.ImageUrl}' was not found for property ID {request.PropertyId}.");
        }

        updatedUrls.RemoveAll(url =>
            string.Equals(url, request.ImageUrl, StringComparison.OrdinalIgnoreCase));

        property.ImageUrls = updatedUrls;
        property.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Remove physical file if present
        try
        {
            var webRootPath = _environment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var relativePath = request.ImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var physicalPath = Path.Combine(webRootPath, relativePath);

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }
        }
        catch
        {
            // Ignore file deletion exception if file is missing/locked
        }

        var dto = new ImageUploadResponseDto
        {
            PropertyId = property.Id,
            ImageUrls = property.ImageUrls,
            PrimaryImageUrl = property.ImageUrls.FirstOrDefault()
        };

        return PropertyImageResult.Success(dto);
    }
}
