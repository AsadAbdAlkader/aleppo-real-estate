using System.Text.Json;
using Application.Common.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Web.Middlewares;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AgencyScopeViolationException ex)
        {
            _logger.LogWarning("Agency Scope Violation: {Message}", ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            var payload = new
            {
                type = "https://tools.ietf.org/html/rfc7231#section-6.5.3",
                title = "Agency Scope Violation",
                status = 403,
                error = ex.Message,
                code = AgencyScopeViolationException.ErrorCode
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (ForbiddenAccessException ex)
        {
            _logger.LogWarning("Forbidden Access: {Message}", ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            var payload = new
            {
                type = "https://tools.ietf.org/html/rfc7231#section-6.5.3",
                title = "Forbidden",
                status = 403,
                error = ex.Message
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (ValidationException ex)
        {
            _logger.LogInformation("Validation Exception: {Errors}", ex.Errors);
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()
                );
            var payload = new
            {
                type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                title = "One or more validation errors occurred.",
                status = 400,
                errors
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized: {Message}", ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            var payload = new
            {
                status = 401,
                error = ex.Message
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning("Not Found: {Message}", ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            var payload = new
            {
                status = 404,
                error = ex.Message
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled Exception caught in GlobalExceptionHandlerMiddleware: {Message}", ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            var payload = new
            {
                status = 500,
                error = "An unexpected error occurred. Please try again later."
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}
