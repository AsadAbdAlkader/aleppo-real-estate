using System.Security.Claims;
using Application.Users.Commands.ChangePassword;
using Application.Users.Commands.UpdateUserProfile;
using Application.Users.Dtos;
using Application.Users.Queries.GetUserProfile;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("/profile", async (
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var query = new GetUserProfileQuery(userId.Value);
            var result = await mediator.Send(query);

            if (result is null)
            {
                return Results.NotFound(new { error = "User profile not found." });
            }

            return Results.Ok(result);
        })
        .WithName("GetUserProfile")
        .Produces<UserProfileDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/profile", async (
            [FromBody] UpdateUserProfileRequest req,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            try
            {
                var command = new UpdateUserProfileCommand(
                    userId.Value,
                    req.FirstName,
                    req.LastName,
                    req.PhoneNumber
                );

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
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
        })
        .WithName("UpdateUserProfile")
        .Produces<UserProfileDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/change-password", async (
            [FromBody] ChangePasswordRequest req,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            try
            {
                var command = new ChangePasswordCommand(
                    userId.Value,
                    req.CurrentPassword,
                    req.NewPassword
                );

                var result = await mediator.Send(command);
                if (!result.Success)
                {
                    return Results.BadRequest(new { error = result.ErrorMessage });
                }

                return Results.Ok(new { message = result.Message });
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
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
        })
        .WithName("ChangePassword")
        .Produces(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);
    }
}

public record UpdateUserProfileRequest(string FirstName, string LastName, string? PhoneNumber);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
