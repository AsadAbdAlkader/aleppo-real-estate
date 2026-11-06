using Application.Agencies.Dtos;
using Application.Common.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Agencies.Commands.CreateAgency;

public record CreateAgencyCommand : IRequest<CreateAgencyResult>
{
    public string UserRole { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Address { get; init; }
    public string? CityArea { get; init; }
    public string? LogoUrl { get; init; }
    public string? LicenseNumber { get; init; }
}

public enum CreateAgencyStatus
{
    Success,
    Forbidden,
    BadRequest
}

public class CreateAgencyResult
{
    public CreateAgencyStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public AgencyDto? Data { get; set; }

    public static CreateAgencyResult Success(AgencyDto data) =>
        new() { Status = CreateAgencyStatus.Success, Data = data };

    public static CreateAgencyResult Forbidden(string message) =>
        new() { Status = CreateAgencyStatus.Forbidden, ErrorMessage = message };

    public static CreateAgencyResult BadRequest(string message) =>
        new() { Status = CreateAgencyStatus.BadRequest, ErrorMessage = message };
}

public class CreateAgencyCommandValidator : AbstractValidator<CreateAgencyCommand>
{
    public CreateAgencyCommandValidator()
    {
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

public class CreateAgencyCommandHandler : IRequestHandler<CreateAgencyCommand, CreateAgencyResult>
{
    private readonly IApplicationDbContext _context;

    public CreateAgencyCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateAgencyResult> Handle(CreateAgencyCommand request, CancellationToken cancellationToken)
    {
        var isAgent = string.Equals(request.UserRole, "Agent", StringComparison.OrdinalIgnoreCase);
        var isAdmin = string.Equals(request.UserRole, "Admin", StringComparison.OrdinalIgnoreCase);

        if (!isAgent && !isAdmin)
        {
            return CreateAgencyResult.Forbidden("يمكن للوكلاء والإدارة فقط إضافة مكتب عقاري جديد.");
        }

        var agency = new Agency
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Address = request.Address?.Trim(),
            CityArea = request.CityArea?.Trim(),
            LogoUrl = request.LogoUrl?.Trim(),
            LicenseNumber = request.LicenseNumber?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Agencies.Add(agency);
        await _context.SaveChangesAsync(cancellationToken);

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
            AgentsCount = 0,
            ActivePropertiesCount = 0,
            CreatedAt = agency.CreatedAt
        };

        return CreateAgencyResult.Success(dto);
    }
}
