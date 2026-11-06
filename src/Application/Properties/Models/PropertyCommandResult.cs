using Application.Properties.Dtos;

namespace Application.Properties.Models;

public enum PropertyCommandStatus
{
    Success,
    NotFound,
    Forbidden,
    BadRequest
}

public class UpdatePropertyResult
{
    public PropertyCommandStatus Status { get; set; }
    public PropertyDto? Property { get; set; }
    public string? ErrorMessage { get; set; }

    public static UpdatePropertyResult Success(PropertyDto property) =>
        new() { Status = PropertyCommandStatus.Success, Property = property };

    public static UpdatePropertyResult NotFound(string message) =>
        new() { Status = PropertyCommandStatus.NotFound, ErrorMessage = message };

    public static UpdatePropertyResult Forbidden(string message) =>
        new() { Status = PropertyCommandStatus.Forbidden, ErrorMessage = message };
}

public class DeletePropertyResult
{
    public PropertyCommandStatus Status { get; set; }
    public string? ErrorMessage { get; set; }

    public static DeletePropertyResult Success() =>
        new() { Status = PropertyCommandStatus.Success };

    public static DeletePropertyResult NotFound(string message) =>
        new() { Status = PropertyCommandStatus.NotFound, ErrorMessage = message };

    public static DeletePropertyResult Forbidden(string message) =>
        new() { Status = PropertyCommandStatus.Forbidden, ErrorMessage = message };
}

public class PropertyImageResult
{
    public PropertyCommandStatus Status { get; set; }
    public ImageUploadResponseDto? Data { get; set; }
    public string? ErrorMessage { get; set; }

    public static PropertyImageResult Success(ImageUploadResponseDto data) =>
        new() { Status = PropertyCommandStatus.Success, Data = data };

    public static PropertyImageResult NotFound(string message) =>
        new() { Status = PropertyCommandStatus.NotFound, ErrorMessage = message };

    public static PropertyImageResult Forbidden(string message) =>
        new() { Status = PropertyCommandStatus.Forbidden, ErrorMessage = message };

    public static PropertyImageResult BadRequest(string message) =>
        new() { Status = PropertyCommandStatus.BadRequest, ErrorMessage = message };
}
