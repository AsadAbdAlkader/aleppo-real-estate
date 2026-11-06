using FluentValidation;

namespace Application.Properties.Commands.DeletePropertyImage;

public class DeletePropertyImageCommandValidator : AbstractValidator<DeletePropertyImageCommand>
{
    public DeletePropertyImageCommandValidator()
    {
        RuleFor(x => x.PropertyId)
            .NotEmpty()
            .WithMessage("Property ID is required.");

        RuleFor(x => x.ImageUrl)
            .NotEmpty()
            .WithMessage("Image URL is required.");
    }
}
