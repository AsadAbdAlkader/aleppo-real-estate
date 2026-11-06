using Application.Common.Interfaces;
using Application.Properties.Dtos;
using Application.Properties.Models;
using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Commands.UploadPropertyImages;

public record UploadPropertyImagesCommand : IRequest<PropertyImageResult>
{
    public Guid PropertyId { get; init; }
    public List<IFormFile> Files { get; init; } = new();
    public string CurrentUserId { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
}

public class UploadPropertyImagesCommandHandler : IRequestHandler<UploadPropertyImagesCommand, PropertyImageResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public UploadPropertyImagesCommandHandler(IApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<PropertyImageResult> Handle(UploadPropertyImagesCommand request, CancellationToken cancellationToken)
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

        var webRootPath = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploadsDirectory = Path.Combine(webRootPath, "uploads", "properties");
        if (!Directory.Exists(uploadsDirectory))
        {
            Directory.CreateDirectory(uploadsDirectory);
        }

        var updatedUrls = new List<string>(property.ImageUrls ?? new List<string>());

        foreach (var file in request.Files)
        {
            if (file == null || file.Length == 0)
            {
                continue;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"{request.PropertyId}_{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsDirectory, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var relativeUrl = $"/uploads/properties/{uniqueFileName}";
            updatedUrls.Add(relativeUrl);
        }

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
