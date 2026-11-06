using System.Security.Claims;
using Application.Notifications.Commands.MarkAllNotificationsAsRead;
using Application.Notifications.Commands.MarkNotificationAsRead;
using Application.Notifications.Dtos;
using Application.Notifications.Queries.GetNotifications;
using Application.Notifications.Queries.GetUnreadNotificationsCount;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/notifications")
            .WithTags("Notifications")
            .RequireAuthorization();

        group.MapGet("/", async (
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool unreadOnly = false,
            ClaimsPrincipal user = default!,
            [FromServices] IMediator mediator = default!) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var query = new GetNotificationsQuery
            {
                CurrentUserId = userId.Value.ToString(),
                PageNumber = pageNumber,
                PageSize = pageSize,
                UnreadOnly = unreadOnly
            };

            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetNotifications")
        .Produces<PaginatedList<NotificationDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/unread-count", async (
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var query = new GetUnreadNotificationsCountQuery(userId.Value.ToString());
            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetUnreadNotificationsCount")
        .Produces<UnreadCountDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}/read", async (
            Guid id,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var command = new MarkNotificationAsReadCommand(id, userId.Value.ToString());
            var success = await mediator.Send(command);

            if (!success)
            {
                return Results.NotFound(new { error = $"Notification with ID {id} was not found." });
            }

            return Results.Ok();
        })
        .WithName("MarkNotificationAsRead")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/read-all", async (
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var command = new MarkAllNotificationsAsReadCommand(userId.Value.ToString());
            await mediator.Send(command);
            return Results.Ok();
        })
        .WithName("MarkAllNotificationsAsRead")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
