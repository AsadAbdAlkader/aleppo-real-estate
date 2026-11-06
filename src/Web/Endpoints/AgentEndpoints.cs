using System.Security.Claims;
using Application.Agents.Commands.UpdateAgentProfile;
using Application.Agents.Dtos;
using Application.Agents.Queries.GetAgentById;
using Application.Agents.Queries.GetAgentProperties;
using Application.Agents.Queries.GetAgents;
using Application.Properties.Dtos;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public record UpdateAgentProfileRequest(
    string? Bio,
    string? PublicPhone,
    Guid? AgencyId
);

public static class AgentEndpoints
{
    public static void MapAgentEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/agents")
            .WithTags("Agents");

        group.MapGet("/", async (
            [FromQuery] string? searchTerm,
            [FromQuery] string? cityArea,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromServices] IMediator mediator = default!) =>
        {
            var query = new GetAgentsQuery
            {
                SearchTerm = searchTerm,
                CityArea = cityArea,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetAgents")
        .Produces<PaginatedList<AgentDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id}", async (string id, [FromServices] IMediator mediator) =>
        {
            var result = await mediator.Send(new GetAgentByIdQuery(id));
            if (result is null)
            {
                return Results.NotFound(new { error = $"Agent with ID {id} was not found." });
            }
            return Results.Ok(result);
        })
        .WithName("GetAgentById")
        .Produces<AgentDetailsDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/{id}/properties", async (
            string id,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromServices] IMediator mediator = default!) =>
        {
            var query = new GetAgentPropertiesQuery(id, pageNumber, pageSize);
            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetAgentProperties")
        .Produces<PaginatedList<PropertyDto>>(StatusCodes.Status200OK);

        group.MapPut("/me", async (
            [FromBody] UpdateAgentProfileRequest request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var role = user.FindFirstValue(ClaimTypes.Role) ?? user.FindFirstValue("role") ?? "Buyer";

            var command = new UpdateAgentProfileCommand
            {
                CurrentUserId = userId.Value.ToString(),
                UserRole = role,
                Bio = request.Bio,
                PublicPhone = request.PublicPhone,
                AgencyId = request.AgencyId
            };

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    AgentProfileCommandStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    AgentProfileCommandStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                    AgentProfileCommandStatus.BadRequest => Results.BadRequest(new { error = result.ErrorMessage }),
                    AgentProfileCommandStatus.Success => Results.Ok(result.Data),
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
        .WithName("UpdateAgentProfile")
        .RequireAuthorization()
        .Produces<AgentProfileResponseDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);
    }
}
