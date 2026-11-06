using FluentValidation;

namespace Application.Inquiries.Commands.CreateInquiry;

public class CreateInquiryCommandValidator : AbstractValidator<CreateInquiryCommand>
{
    public CreateInquiryCommandValidator()
    {
        RuleFor(v => v.PropertyId)
            .NotEmpty().WithMessage("PropertyId is required.");

        RuleFor(v => v.Message)
            .NotEmpty().WithMessage("Message is required.")
            .MaximumLength(2000).WithMessage("Message must not exceed 2000 characters.");

        RuleFor(v => v.PhoneNumber)
            .NotEmpty().WithMessage("PhoneNumber is required.")
            .MaximumLength(50).WithMessage("PhoneNumber must not exceed 50 characters.");
    }
}
