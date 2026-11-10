using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Common.Security;
using Application.Properties.Dtos;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Commands.CreateProperty;

public record CreatePropertyCommand : IRequest<PropertyDto>, IAgencyScopedRequest
{
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
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public string? OwnerId { get; set; }
}

public class CreatePropertyCommandHandler : IRequestHandler<CreatePropertyCommand, PropertyDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantContext? _tenantContext;

    public CreatePropertyCommandHandler(IApplicationDbContext context, ITenantContext? tenantContext = null)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<PropertyDto> Handle(CreatePropertyCommand request, CancellationToken cancellationToken)
    {
        Guid? effectiveAgencyId = null;
        Guid? creatorUserGuid = null;

        if (!string.IsNullOrEmpty(request.OwnerId) && Guid.TryParse(request.OwnerId, out var parsedGuid))
        {
            creatorUserGuid = parsedGuid;
        }

        if (_tenantContext != null)
        {
            await _tenantContext.EnsureValidAgencyContextAsync(cancellationToken);

            if (!_tenantContext.IsActiveMember || !_tenantContext.AgencyId.HasValue)
            {
                throw new AgencyScopeViolationException(
                    "SEC-SCOPE-VIOLATION: Creating a property requires an active agency membership.");
            }

            var role = _tenantContext.AgencyRole ?? string.Empty;
            var allowedRoles = new[] { "Owner", "Admin", "Agent" };
            if (!allowedRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            {
                throw new AgencyScopeViolationException(
                    $"SEC-FORBIDDEN-ROLE: Members with role '{role}' are not permitted to create properties.");
            }

            effectiveAgencyId = _tenantContext.AgencyId;
        }
        else if (request.AgencyId.HasValue)
        {
            effectiveAgencyId = request.AgencyId.Value;
        }

        var property = new Property
        {
            Id = Guid.NewGuid(),
            AgencyId = effectiveAgencyId,
            CreatedByUserId = creatorUserGuid,
            OwnerId = request.OwnerId,
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Category = request.Category,
            Purpose = string.IsNullOrWhiteSpace(request.Purpose) ? Domain.Constants.PropertyPurposes.Sale : request.Purpose,
            City = string.IsNullOrWhiteSpace(request.City) ? "حلب" : request.City,
            CityArea = request.CityArea,
            Address = request.Address,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            AreaSquareMeters = request.AreaSquareMeters,
            ImageUrls = request.ImageUrls ?? new List<string>(),
            Status = Domain.Constants.PropertyStatuses.Available,
            IsFeatured = false,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CreatedAt = DateTime.UtcNow
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync(cancellationToken);

        string? ownerName = null;
        if (!string.IsNullOrEmpty(property.OwnerId))
        {
            var owner = await _context.Users
                .FirstOrDefaultAsync(u => u.Id.ToString() == property.OwnerId, cancellationToken);
            if (owner != null)
            {
                var fullName = $"{owner.FirstName} {owner.LastName}".Trim();
                ownerName = string.IsNullOrWhiteSpace(fullName) ? null : fullName;
            }
        }

        string? agencyName = null;
        string? agencySlug = null;
        if (property.AgencyId.HasValue)
        {
            var agency = await _context.Agencies
                .FirstOrDefaultAsync(a => a.Id == property.AgencyId.Value, cancellationToken);
            if (agency != null)
            {
                agencyName = agency.Name;
                agencySlug = agency.Slug;
            }
        }

        return new PropertyDto
        {
            Id = property.Id,
            AgencyId = property.AgencyId,
            AgencyName = agencyName,
            AgencySlug = agencySlug,
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
    }
}
