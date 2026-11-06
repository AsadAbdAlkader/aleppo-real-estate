using System.Security.Claims;
using Application.Favorites.Commands.AddFavorite;
using Application.Favorites.Commands.RemoveFavorite;
using Application.Favorites.Dtos;
using Application.Favorites.Queries.GetUserFavorites;
using Application.Properties.Dtos;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public static class FavoriteEndpoints
{
    public static void MapFavoriteEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/favorites")
            .WithTags("Favorites")
            .RequireAuthorization();

        group.MapPost("/{propertyId:guid}", async (Guid propertyId, ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new AddFavoriteCommand(userId.Value, propertyId));
            if (result is null)
            {
                return Results.NotFound(new { error = $"Property with ID {propertyId} was not found." });
            }

            return Results.Ok(result);
        })
        .WithName("AddFavorite")
        .Produces<FavoriteResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{propertyId:guid}", async (Guid propertyId, ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new RemoveFavoriteCommand(userId.Value, propertyId));
            if (result is null)
            {
                return Results.NotFound(new { error = $"Property with ID {propertyId} was not found." });
            }

            return Results.Ok(result);
        })
        .WithName("RemoveFavorite")
        .Produces<FavoriteResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/", async (ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new GetUserFavoritesQuery(userId.Value));
            return Results.Ok(result);
        })
        .WithName("GetUserFavorites")
        .Produces<List<PropertyDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
