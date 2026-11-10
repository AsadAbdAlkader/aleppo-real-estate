using System.Security.Claims;
using Application.Properties.Commands.CreateProperty;
using Application.Properties.Commands.DeleteProperty;
using Application.Properties.Commands.DeletePropertyImage;
using Application.Properties.Commands.SetPrimaryPropertyImage;
using Application.Properties.Commands.UpdateProperty;
using Application.Properties.Commands.UploadPropertyImages;
using Application.Properties.Dtos;
using Application.Properties.Models;
using Application.Properties.Queries.GetMyProperties;
using Application.Properties.Queries.GetProperties;
using Application.Properties.Queries.GetPropertyById;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public record UpdatePropertyRequest(
    string Title,
    string Description,
    decimal Price,
    string Category,
    string? Purpose,
    string? City,
    string CityArea,
    string Address,
    int Bedrooms,
    int Bathrooms,
    double AreaSquareMeters,
    List<string>? ImageUrls,
    string Status,
    bool? IsFeatured
);

public record DeletePropertyImageRequest(string ImageUrl);
public record SetPrimaryPropertyImageRequest(string ImageUrl);

public static class PropertyEndpoints
{
    public static void MapPropertyEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/properties")
            .WithTags("Properties");

        group.MapGet("/", async (
            [FromQuery] string? searchTerm,
            [FromQuery] string? city,
            [FromQuery] string? cityArea,
            [FromQuery] string? category,
            [FromQuery] string? purpose,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] double? minArea,
            [FromQuery] double? maxArea,
            [FromQuery] int? bedrooms,
            [FromQuery] int? bathrooms,
            [FromQuery] string? status,
            [FromQuery] string? sortBy,
            [FromQuery] Guid? agencyId,
            [FromQuery] string? agencySlug,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromServices] IMediator mediator = default!) =>
        {
            var query = new GetPropertiesQuery
            {
                SearchTerm = searchTerm,
                City = city,
                CityArea = cityArea,
                Category = category,
                Purpose = purpose,
                MinPrice = minPrice,
                MaxPrice = maxPrice,
                MinArea = minArea,
                MaxArea = maxArea,
                Bedrooms = bedrooms,
                Bathrooms = bathrooms,
                Status = status,
                SortBy = sortBy,
                AgencyId = agencyId,
                AgencySlug = agencySlug,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetProperties")
        .Produces<PaginatedList<PropertyDto>>(StatusCodes.Status200OK);

        group.MapGet("/my", async (ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new GetMyPropertiesQuery(userId.Value.ToString()));
            return Results.Ok(result);
        })
        .WithName("GetMyProperties")
        .RequireAuthorization()
        .Produces<List<PropertyDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:guid}", async (Guid id, [FromServices] IMediator mediator) =>
        {
            var result = await mediator.Send(new GetPropertyByIdQuery(id));
            if (result is null)
            {
                return Results.NotFound(new { error = $"Property with ID {id} was not found or is no longer available." });
            }
            return Results.Ok(result);
        })
        .WithName("GetPropertyById")
        .Produces<PropertyDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async ([FromBody] CreatePropertyCommand command, ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            command.OwnerId = userId.Value.ToString();

            try
            {
                var result = await mediator.Send(command);
                return Results.Created($"/api/properties/{result.Id}", result);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("CreateProperty")
        .RequireAuthorization()
        .Produces<PropertyDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}", async (Guid id, [FromBody] UpdatePropertyRequest request, ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var isAdmin = user.IsInRole("Admin");

            var command = new UpdatePropertyCommand
            {
                Id = id,
                Title = request.Title,
                Description = request.Description,
                Price = request.Price,
                Category = request.Category,
                Purpose = request.Purpose ?? "Sale",
                City = request.City ?? "حلب",
                CityArea = request.CityArea,
                Address = request.Address,
                Bedrooms = request.Bedrooms,
                Bathrooms = request.Bathrooms,
                AreaSquareMeters = request.AreaSquareMeters,
                ImageUrls = request.ImageUrls ?? new List<string>(),
                Status = request.Status,
                IsFeatured = request.IsFeatured,
                CurrentUserId = userId.Value.ToString(),
                IsAdmin = isAdmin
            };

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    PropertyCommandStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                    PropertyCommandStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    PropertyCommandStatus.Success => Results.Ok(result.Property),
                    _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
                };
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("UpdateProperty")
        .RequireAuthorization()
        .Produces<PropertyDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var isAdmin = user.IsInRole("Admin");

            var command = new DeletePropertyCommand(id, userId.Value.ToString(), isAdmin);
            var result = await mediator.Send(command);

            return result.Status switch
            {
                PropertyCommandStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                PropertyCommandStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                PropertyCommandStatus.Success => Results.Ok(new { message = "Property deleted successfully." }),
                _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
            };
        })
        .WithName("DeleteProperty")
        .RequireAuthorization()
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        // Image Endpoints
        group.MapPost("/{id:guid}/images", async (
            Guid id,
            [FromForm] List<IFormFile>? files,
            HttpRequest request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var isAdmin = user.IsInRole("Admin");
            var uploadedFiles = files != null && files.Count > 0
                ? files
                : (request.HasFormContentType ? request.Form.Files.ToList() : new List<IFormFile>());

            var command = new UploadPropertyImagesCommand
            {
                PropertyId = id,
                Files = uploadedFiles,
                CurrentUserId = userId.Value.ToString(),
                IsAdmin = isAdmin
            };

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    PropertyCommandStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                    PropertyCommandStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    PropertyCommandStatus.BadRequest => Results.BadRequest(new { error = result.ErrorMessage }),
                    PropertyCommandStatus.Success => Results.Ok(result.Data),
                    _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
                };
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("UploadPropertyImages")
        .RequireAuthorization()
        .DisableAntiforgery()
        .Produces<ImageUploadResponseDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}/images", async (
            Guid id,
            [FromBody] DeletePropertyImageRequest request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var isAdmin = user.IsInRole("Admin");

            var command = new DeletePropertyImageCommand(id, request.ImageUrl, userId.Value.ToString(), isAdmin);

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    PropertyCommandStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                    PropertyCommandStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    PropertyCommandStatus.BadRequest => Results.BadRequest(new { error = result.ErrorMessage }),
                    PropertyCommandStatus.Success => Results.Ok(result.Data),
                    _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
                };
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("DeletePropertyImage")
        .RequireAuthorization()
        .Produces<ImageUploadResponseDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/{id:guid}/images/primary", async (
            Guid id,
            [FromBody] SetPrimaryPropertyImageRequest request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var isAdmin = user.IsInRole("Admin");

            var command = new SetPrimaryPropertyImageCommand(id, request.ImageUrl, userId.Value.ToString(), isAdmin);

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    PropertyCommandStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                    PropertyCommandStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    PropertyCommandStatus.BadRequest => Results.BadRequest(new { error = result.ErrorMessage }),
                    PropertyCommandStatus.Success => Results.Ok(result.Data),
                    _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
                };
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("SetPrimaryPropertyImage")
        .RequireAuthorization()
        .Produces<ImageUploadResponseDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);
    }
}
