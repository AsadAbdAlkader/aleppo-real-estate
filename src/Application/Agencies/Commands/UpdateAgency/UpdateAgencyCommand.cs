using Application.Agencies.Dtos;
using Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agencies.Commands.UpdateAgency;

public record UpdateAgencyCommand : IRequest<UpdateAgencyResult>
{
    public Guid AgencyId { get; init; }
    public string UserRole { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Address { get; init; }
    public string? CityArea { get; init; }
    public string? LogoUrl { get; init; }
    public string? LicenseNumber { get; init; }
}

public enum UpdateAgencyStatus
{
    Success,
    NotFound,
    Forbidden,
    BadRequest
}

public class UpdateAgencyResult
{
    public UpdateAgencyStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public AgencyDto? Data { get; set; }

    public static UpdateAgencyResult Success(AgencyDto data) =>
        new() { Status = UpdateAgencyStatus.Success, Data = data };

    public static UpdateAgencyResult NotFound(string message) =>
        new() { Status = UpdateAgencyStatus.NotFound, ErrorMessage = message };

    public static UpdateAgencyResult Forbidden(string message) =>
        new() { Status = UpdateAgencyStatus.Forbidden, ErrorMessage = message };

    public static UpdateAgencyResult BadRequest(string message) =>
        new() { Status = UpdateAgencyStatus.BadRequest, ErrorMessage = message };
}

public class UpdateAgencyCommandValidator : AbstractValidator<UpdateAgencyCommand>
{
    public UpdateAgencyCommandValidator()
    {
        RuleFor(v => v.AgencyId)
            .NotEmpty().WithMessage("معرف المكتب العقاري مطلوب");

        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("اسم المكتب العقاري مطلوب")
            .MaximumLength(200).WithMessage("اسم المكتب العقاري يجب ألا يتجاوز 200 حرف");

        RuleFor(v => v.Description)
            .MaximumLength(2000).WithMessage("الوصف يجب ألا يتجاوز 2000 حرف");

        RuleFor(v => v.PhoneNumber)
            .MaximumLength(50).WithMessage("رقم الهاتف يجب ألا يتجاوز 50 حرفاً");

        RuleFor(v => v.Address)
            .MaximumLength(300).WithMessage("العنوان يجب ألا يتجاوز 300 حرف");

        RuleFor(v => v.CityArea)
            .MaximumLength(100).WithMessage("المنطقة/الحي يجب ألا يتجاوز 100 حرف");

        RuleFor(v => v.LogoUrl)
            .MaximumLength(1000).WithMessage("رابط الشعار يجب ألا يتجاوز 1000 حرف");

        RuleFor(v => v.LicenseNumber)
            .MaximumLength(100).WithMessage("رقم الترخيص يجب ألا يتجاوز 100 حرف");
    }
}

public class UpdateAgencyCommandHandler : IRequestHandler<UpdateAgencyCommand, UpdateAgencyResult>
{
    private readonly IApplicationDbContext _context;

    public UpdateAgencyCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UpdateAgencyResult> Handle(UpdateAgencyCommand request, CancellationToken cancellationToken)
    {
        var isAgent = string.Equals(request.UserRole, "Agent", StringComparison.OrdinalIgnoreCase);
        var isAdmin = string.Equals(request.UserRole, "Admin", StringComparison.OrdinalIgnoreCase);

        if (!isAgent && !isAdmin)
        {
            return UpdateAgencyResult.Forbidden("يمكن للوكلاء والإدارة فقط تعديل بيانات المكتب العقاري.");
        }

        var agency = await _context.Agencies
            .FirstOrDefaultAsync(a => a.Id == request.AgencyId, cancellationToken);

        if (agency == null)
        {
            return UpdateAgencyResult.NotFound($"المكتب العقاري برقم {request.AgencyId} غير موجود.");
        }

        agency.Name = request.Name.Trim();
        agency.Description = request.Description?.Trim();
        agency.PhoneNumber = request.PhoneNumber?.Trim();
        agency.Address = request.Address?.Trim();
        agency.CityArea = request.CityArea?.Trim();
        agency.LogoUrl = request.LogoUrl?.Trim();
        agency.LicenseNumber = request.LicenseNumber?.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        var agentsCount = await _context.AgentProfiles
            .CountAsync(ap => ap.AgencyId == agency.Id, cancellationToken);

        var agentUserIds = await _context.AgentProfiles
            .Where(ap => ap.AgencyId == agency.Id)
            .Select(ap => ap.UserId)
            .ToListAsync(cancellationToken);

        var activePropertiesCount = await _context.Properties
            .CountAsync(p => p.OwnerId != null && agentUserIds.Contains(p.OwnerId) && p.Status != "Archived", cancellationToken);

        var dto = new AgencyDto
        {
            Id = agency.Id,
            Name = agency.Name,
            Description = agency.Description,
            PhoneNumber = agency.PhoneNumber,
            Address = agency.Address,
            CityArea = agency.CityArea,
            LogoUrl = agency.LogoUrl,
            LicenseNumber = agency.LicenseNumber,
            AgentsCount = agentsCount,
            ActivePropertiesCount = activePropertiesCount,
            CreatedAt = agency.CreatedAt
        };

        return UpdateAgencyResult.Success(dto);
    }
}
