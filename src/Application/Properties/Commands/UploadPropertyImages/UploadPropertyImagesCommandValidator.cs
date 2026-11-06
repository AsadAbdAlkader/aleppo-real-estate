using FluentValidation;

namespace Application.Properties.Commands.UploadPropertyImages;

public class UploadPropertyImagesCommandValidator : AbstractValidator<UploadPropertyImagesCommand>
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    public UploadPropertyImagesCommandValidator()
    {
        RuleFor(x => x.PropertyId)
            .NotEmpty()
            .WithMessage("Property ID is required.");

        RuleFor(x => x.Files)
            .NotNull()
            .Must(files => files != null && files.Count > 0)
            .WithMessage("At least one image file must be uploaded.");

        RuleForEach(x => x.Files)
            .ChildRules(file =>
            {
                file.RuleFor(f => f.Length)
                    .GreaterThan(0)
                    .WithMessage("File cannot be empty.")
                    .LessThanOrEqualTo(MaxFileSizeBytes)
                    .WithMessage("File size must not exceed 5MB.");

                file.RuleFor(f => f.FileName)
                    .Must(fileName =>
                    {
                        if (string.IsNullOrWhiteSpace(fileName)) return false;
                        var ext = Path.GetExtension(fileName).ToLowerInvariant();
                        return AllowedExtensions.Contains(ext);
                    })
                    .WithMessage("Only .jpg, .jpeg, .png, and .webp file extensions are allowed.");
            });
    }
}
