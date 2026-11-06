using System.Security.Claims;
using Application.Dashboard.Dtos;
using Application.Dashboard.Queries.GetUserDashboard;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new GetUserDashboardQuery(userId.Value));
            if (result is null)
            {
                return Results.NotFound(new { error = "User profile not found." });
            }

            return Results.Ok(result);
        })
        .WithName("GetUserDashboard")
        .Produces<DashboardDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);
    }
}
