using System.Security.Claims;
using Application.Auth.Commands.LoginUser;
using Application.Auth.Commands.RegisterUser;
using Application.Auth.Dtos;
using Application.Auth.Queries.GetCurrentUser;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/auth")
            .WithTags("Authentication");

        group.MapPost("/register", async ([FromBody] RegisterUserCommand command, [FromServices] IMediator mediator) =>
        {
            try
            {
                var result = await mediator.Send(command);
                return Results.Ok(result);
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
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { errors = new[] { ex.Message } });
            }
        })
        .WithName("RegisterUser")
        .Produces<AuthResponseDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("/login", async ([FromBody] LoginUserCommand command, [FromServices] IMediator mediator) =>
        {
            try
            {
                var result = await mediator.Send(command);
                return Results.Ok(result);
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
            catch (UnauthorizedAccessException ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: StatusCodes.Status401Unauthorized);
            }
        })
        .WithName("LoginUser")
        .Produces<AuthResponseDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/me", async (ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier) 
                ?? user.FindFirstValue("sub");

            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new GetCurrentUserQuery(userId));
            if (result == null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(result);
        })
        .WithName("GetCurrentUser")
        .RequireAuthorization()
        .Produces<UserProfileDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
