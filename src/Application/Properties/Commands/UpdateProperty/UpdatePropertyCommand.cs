using Application.Common.Interfaces;
using Application.Common.Security;
using Application.Properties.Dtos;
using Application.Properties.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Commands.UpdateProperty;

public record UpdatePropertyCommand : IRequest<UpdatePropertyResult>, IAgencyScopedRequest
{
    public Guid Id { get; init; }
    public Guid? AgencyId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Purpose { get; init; } = "Sale";
    public string City { get; init; } = "حلب";
    public string CityArea { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public int Bedrooms { get; init; }
    public int Bathrooms { get; init; }
    public double AreaSquareMeters { get; init; }
    public List<string> ImageUrls { get; init; } = new();
    public string Status { get; init; } = "Available";
    public bool? IsFeatured { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }

    public string CurrentUserId { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
}

public class UpdatePropertyCommandHandler : IRequestHandler<UpdatePropertyCommand, UpdatePropertyResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext? _tenantContext;

    public UpdatePropertyCommandHandler(IApplicationDbContext context, ITenantContext? tenantContext = null)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<UpdatePropertyResult> Handle(UpdatePropertyCommand request, CancellationToken cancellationToken)
    {
        var property = await _context.Properties
            .Include(p => p.Owner)
            .Include(p => p.Agency)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (property == null)
        {
            return UpdatePropertyResult.NotFound($"Property with ID {request.Id} was not found.");
        }

        if (_tenantContext != null)
        {
            await _tenantContext.EnsureValidAgencyContextAsync(cancellationToken);

            var isPlatformAdmin = _tenantContext.IsPlatformAdmin || request.IsAdmin;

            if (!isPlatformAdmin)
            {
                if (!_tenantContext.IsActiveMember || !_tenantContext.AgencyId.HasValue)
                {
                    return UpdatePropertyResult.Forbidden("SEC-SCOPE-VIOLATION: Active agency membership required.");
                }

                // Cross-agency boundary check
                if (property.AgencyId != _tenantContext.AgencyId.Value)
                {
                    return UpdatePropertyResult.Forbidden("SEC-FORBIDDEN-AGENCY: Property belongs to another agency.");
                }

                var role = _tenantContext.AgencyRole ?? string.Empty;

                if (string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    // Authorized: Agency Owner / Admin can update any property within their agency
                }
                else if (string.Equals(role, "Agent", StringComparison.OrdinalIgnoreCase))
                {
                    // Agent can only update properties they created/own within the agency
                    var isCreator = (property.CreatedByUserId.HasValue && property.CreatedByUserId.Value.ToString().Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase)) ||
                                    (!string.IsNullOrEmpty(property.OwnerId) && property.OwnerId.Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase));

                    if (!isCreator)
                    {
                        return UpdatePropertyResult.Forbidden("SEC-FORBIDDEN-AGENT: Agents can only update properties they created.");
                    }
                }
                else
                {
                    return UpdatePropertyResult.Forbidden($"SEC-FORBIDDEN-ROLE: Members with role '{role}' cannot update properties.");
                }
            }
        }
        else
        {
            var isOwner = !string.IsNullOrEmpty(property.OwnerId) &&
                          property.OwnerId.Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase);

            if (!isOwner && !request.IsAdmin)
            {
                return UpdatePropertyResult.Forbidden("You do not have permission to modify this property.");
            }
        }

        property.Title = request.Title;
        property.Description = request.Description;
        property.Price = request.Price;
        property.Category = request.Category;
        if (!string.IsNullOrWhiteSpace(request.Purpose))
        {
            property.Purpose = request.Purpose;
        }
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            property.City = request.City;
        }
        property.CityArea = request.CityArea;
        property.Address = request.Address;
        property.Bedrooms = request.Bedrooms;
        property.Bathrooms = request.Bathrooms;
        property.AreaSquareMeters = request.AreaSquareMeters;
        if (request.ImageUrls != null)
        {
            property.ImageUrls = request.ImageUrls;
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            property.Status = request.Status;
        }
        if (request.IsFeatured.HasValue)
        {
            property.IsFeatured = request.IsFeatured.Value;
        }
        if (request.Latitude.HasValue)
        {
            property.Latitude = request.Latitude.Value;
        }
        if (request.Longitude.HasValue)
        {
            property.Longitude = request.Longitude.Value;
        }
        property.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        string? ownerName = null;
        if (property.Owner != null)
        {
            var fullName = $"{property.Owner.FirstName} {property.Owner.LastName}".Trim();
            ownerName = string.IsNullOrWhiteSpace(fullName) ? null : fullName;
        }

        var dto = new PropertyDto
        {
            Id = property.Id,
            AgencyId = property.AgencyId,
            AgencyName = property.Agency?.Name,
            AgencySlug = property.Agency?.Slug,
            CreatedByUserId = property.CreatedByUserId,
            OwnerId = property.OwnerId,
            OwnerName = ownerName,
            Title = property.Title,
            Description = property.Description,
            Price = property.Price,
            Category = property.Category,
            Purpose = property.Purpose,
            City = property.City,
            CityArea = property.CityArea,
            Address = property.Address,
            Bedrooms = property.Bedrooms,
            Bathrooms = property.Bathrooms,
            AreaSquareMeters = property.AreaSquareMeters,
            ImageUrls = property.ImageUrls,
            Status = property.Status,
            IsFeatured = property.IsFeatured,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            CreatedAt = property.CreatedAt,
            UpdatedAt = property.UpdatedAt
        };

        return UpdatePropertyResult.Success(dto);
    }
}
