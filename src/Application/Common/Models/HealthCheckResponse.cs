namespace Application.Common.Models;

public record HealthCheckResponse(
    string Status,
    string Service,
    string Version,
    DateTime TimestampUtc
);
