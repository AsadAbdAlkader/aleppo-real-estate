namespace Web.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/api/health", () => Results.Ok(new
        {
            status = "Healthy",
            service = "CleanArchitecture.AngularTemplate API",
            version = "1.0.0",
            timestampUtc = DateTime.UtcNow
        }))
        .WithName("HealthCheck")
        .WithTags("Health");
    }
}
