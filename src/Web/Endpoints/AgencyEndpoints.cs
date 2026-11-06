using System.Security.Claims;
using Application.Agencies.Commands.CreateAgency;
using Application.Agencies.Commands.UpdateAgency;
using Application.Agencies.Dtos;
using Application.Agencies.Queries.GetAgencies;
using Application.Agencies.Queries.GetAgencyById;
using Application.Properties.Dtos;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public record CreateAgencyRequest(
    string Name,
    string? Description,
    string? PhoneNumber,
    string? Address,
    string? CityArea,
    string? LogoUrl,
    string? LicenseNumber
);

public record UpdateAgencyRequest(
    string Name,
    string? Description,
    string? PhoneNumber,
    string? Address,
    string? CityArea,
    string? LogoUrl,
    string? LicenseNumber
);

public static class AgencyEndpoints
{
    public static void MapAgencyEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/agencies")
            .WithTags("Agencies");

        group.MapGet("/", async (
            [FromQuery] string? searchTerm,
            [FromQuery] string? cityArea,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromServices] IMediator mediator = default!) =>
        {
            var query = new GetAgenciesQuery
            {
                SearchTerm = searchTerm,
                CityArea = cityArea,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetAgencies")
        .Produces<PaginatedList<AgencyDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", async (Guid id, [FromServices] IMediator mediator) =>
        {
            var result = await mediator.Send(new GetAgencyByIdQuery(id));
            if (result is null)
            {
                return Results.NotFound(new { error = $"Agency with ID {id} was not found." });
            }
            return Results.Ok(result);
        })
        .WithName("GetAgencyById")
        .Produces<AgencyDetailsDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
            [FromBody] CreateAgencyRequest request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var role = user.FindFirstValue(ClaimTypes.Role) ?? user.FindFirstValue("role") ?? "Buyer";

            var command = new CreateAgencyCommand
            {
                UserRole = role,
                Name = request.Name,
                Description = request.Description,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                CityArea = request.CityArea,
                LogoUrl = request.LogoUrl,
                LicenseNumber = request.LicenseNumber
            };

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    CreateAgencyStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    CreateAgencyStatus.BadRequest => Results.BadRequest(new { error = result.ErrorMessage }),
                    CreateAgencyStatus.Success => Results.Created($"/api/agencies/{result.Data?.Id}", result.Data),
                    _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
                };
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("CreateAgency")
        .RequireAuthorization()
        .Produces<AgencyDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] UpdateAgencyRequest request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var role = user.FindFirstValue(ClaimTypes.Role) ?? user.FindFirstValue("role") ?? "Buyer";

            var command = new UpdateAgencyCommand
            {
                AgencyId = id,
                UserRole = role,
                Name = request.Name,
                Description = request.Description,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                CityArea = request.CityArea,
                LogoUrl = request.LogoUrl,
                LicenseNumber = request.LicenseNumber
            };

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    UpdateAgencyStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    UpdateAgencyStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                    UpdateAgencyStatus.BadRequest => Results.BadRequest(new { error = result.ErrorMessage }),
                    UpdateAgencyStatus.Success => Results.Ok(result.Data),
                    _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
                };
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("UpdateAgency")
        .RequireAuthorization()
        .Produces<AgencyDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);
    }
}
