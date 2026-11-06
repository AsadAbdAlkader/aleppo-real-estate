using Application.Common.Models;
using MediatR;

namespace Application.Health.Queries.GetHealthStatus;

public record GetHealthStatusQuery : IRequest<HealthCheckResponse>;

public class GetHealthStatusQueryHandler : IRequestHandler<GetHealthStatusQuery, HealthCheckResponse>
{
    public Task<HealthCheckResponse> Handle(GetHealthStatusQuery request, CancellationToken cancellationToken)
    {
        var response = new HealthCheckResponse(
            Status: "Healthy",
            Service: "AleppoRealEstate API",
            Version: "1.0.0",
            TimestampUtc: DateTime.UtcNow
        );

        return Task.FromResult(response);
    }
}
