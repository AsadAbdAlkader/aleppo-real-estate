using Application.Health.Queries.GetHealthStatus;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Web.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", async (ISender sender) =>
        {
            var status = await sender.Send(new GetHealthStatusQuery());
            return Results.Ok(status);
        })
        .WithName("GetHealthStatus")
        .WithTags("Health")
        .Produces<Application.Common.Models.HealthCheckResponse>(StatusCodes.Status200OK);

        return app;
    }
}
