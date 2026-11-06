using System.Security.Claims;
using Application.Tours.Commands.BookTour;
using Application.Tours.Queries.GetMyTours;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Web.Endpoints;

public static class TourEndpoints
{
    public static void MapTourEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tours")
            .WithTags("Tours");

        group.MapPost("/", async (BookTourRequest request, ClaimsPrincipal user, ISender sender) =>
        {
            var userId = user.GetUserId()?.ToString() ?? Guid.NewGuid().ToString();
            var userName = user.FindFirstValue(ClaimTypes.GivenName) ?? request.BuyerName;

            var command = new BookTourCommand
            {
                PropertyId = request.PropertyId,
                BuyerId = userId,
                BuyerName = string.IsNullOrWhiteSpace(request.BuyerName) ? userName : request.BuyerName,
                BuyerPhone = request.BuyerPhone,
                TourDate = request.TourDate,
                TourType = request.TourType,
                Notes = request.Notes
            };

            try
            {
                var result = await sender.Send(command);
                return Results.Created($"/api/tours/{result.Id}", result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("BookPropertyTour")
        .WithSummary("Book an in-person or video inspection tour for a property");

        group.MapGet("/my", async (ClaimsPrincipal user, ISender sender) =>
        {
            var userId = user.GetUserId()?.ToString();
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            var query = new GetMyToursQuery { UserId = userId };
            var result = await sender.Send(query);
            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithName("GetMyPropertyTours")
        .WithSummary("Get list of tours booked by or assigned to the current user");
    }
}

public record BookTourRequest(
    Guid PropertyId,
    string BuyerName,
    string BuyerPhone,
    DateTime TourDate,
    string TourType = "InPerson",
    string? Notes = null);
