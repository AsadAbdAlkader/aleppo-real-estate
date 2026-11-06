using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Users.Commands.ChangePassword;

public record ChangePasswordCommand(
    Guid CurrentUserId,
    string CurrentPassword,
    string NewPassword
) : IRequest<ChangePasswordResult>;

public class ChangePasswordResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }

    public static ChangePasswordResult Ok(string message = "تم تغيير كلمة المرور بنجاح.") =>
        new() { Success = true, Message = message };

    public static ChangePasswordResult Fail(string errorMessage = "كلمة المرور الحالية غير صحيحة.") =>
        new() { Success = false, ErrorMessage = errorMessage };
}

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, ChangePasswordResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<ChangePasswordResult> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.CurrentUserId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{request.CurrentUserId}' was not found.");
        }

        var isCurrentPasswordValid = _passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash);
        if (!isCurrentPasswordValid)
        {
            return ChangePasswordResult.Fail("كلمة المرور الحالية غير صحيحة.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ChangePasswordResult.Ok("تم تغيير كلمة المرور بنجاح.");
    }
}
