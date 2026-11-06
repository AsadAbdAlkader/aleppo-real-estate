using FluentValidation;

namespace Application.Properties.Commands.UpdateProperty;

public class UpdatePropertyCommandValidator : AbstractValidator<UpdatePropertyCommand>
{
    public UpdatePropertyCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Property ID is required.");

        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(v => v.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(v => v.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative.");

        RuleFor(v => v.Category)
            .NotEmpty().WithMessage("Category is required.")
            .MaximumLength(50).WithMessage("Category must not exceed 50 characters.");

        RuleFor(v => v.Purpose)
            .MaximumLength(50).WithMessage("Purpose must not exceed 50 characters.");

        RuleFor(v => v.City)
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(v => v.CityArea)
            .NotEmpty().WithMessage("CityArea is required.")
            .MaximumLength(100).WithMessage("CityArea must not exceed 100 characters.");

        RuleFor(v => v.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(300).WithMessage("Address must not exceed 300 characters.");

        RuleFor(v => v.Bedrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Bedrooms must be non-negative.");

        RuleFor(v => v.Bathrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Bathrooms must be non-negative.");

        RuleFor(v => v.AreaSquareMeters)
            .GreaterThan(0).WithMessage("AreaSquareMeters must be greater than zero.");
    }
}
