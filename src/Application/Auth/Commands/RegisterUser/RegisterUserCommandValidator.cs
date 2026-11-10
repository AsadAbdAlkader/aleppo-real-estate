using Domain.Constants;
using FluentValidation;

namespace Application.Auth.Commands.RegisterUser;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

        RuleFor(v => v.FirstName)
            .NotEmpty().WithMessage("First Name is required.");

        RuleFor(v => v.LastName)
            .NotEmpty().WithMessage("Last Name is required.");

        RuleFor(v => v.Role)
            .NotEmpty()
            .Must(role => Roles.PublicRegistrationRoles.Contains(role))
            .WithMessage("Role must be Buyer or Agent. Creating an Administrator account via public registration is not allowed.");
    }
}
