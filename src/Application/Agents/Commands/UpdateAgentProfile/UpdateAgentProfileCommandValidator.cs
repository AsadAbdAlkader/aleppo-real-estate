using FluentValidation;

namespace Application.Agents.Commands.UpdateAgentProfile;

public class UpdateAgentProfileCommandValidator : AbstractValidator<UpdateAgentProfileCommand>
{
    public UpdateAgentProfileCommandValidator()
    {
        RuleFor(v => v.CurrentUserId)
            .NotEmpty().WithMessage("CurrentUserId is required.");

        RuleFor(v => v.Bio)
            .MaximumLength(2000).WithMessage("Bio must not exceed 2000 characters.");

        RuleFor(v => v.PublicPhone)
            .MaximumLength(50).WithMessage("PublicPhone must not exceed 50 characters.");
    }
}
