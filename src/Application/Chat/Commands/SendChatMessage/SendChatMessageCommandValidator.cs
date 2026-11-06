using FluentValidation;

namespace Application.Chat.Commands.SendChatMessage;

public class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.CurrentUserId)
            .NotEmpty()
            .WithMessage("معرف المرسل مطلوب");

        RuleFor(x => x.ReceiverId)
            .NotEmpty()
            .WithMessage("معرف المستقبل مطلوب");

        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("الرسالة مطلوبة")
            .MaximumLength(4000)
            .WithMessage("الرسالة يجب ألا تتجاوز 4000 حرف");
    }
}
