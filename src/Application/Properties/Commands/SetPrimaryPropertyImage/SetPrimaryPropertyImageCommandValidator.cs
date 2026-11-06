using FluentValidation;

namespace Application.Properties.Commands.SetPrimaryPropertyImage;

public class SetPrimaryPropertyImageCommandValidator : AbstractValidator<SetPrimaryPropertyImageCommand>
{
    public SetPrimaryPropertyImageCommandValidator()
    {
        RuleFor(x => x.PropertyId)
            .NotEmpty()
            .WithMessage("Property ID is required.");

        RuleFor(x => x.ImageUrl)
            .NotEmpty()
            .WithMessage("Image URL is required.");
    }
}
