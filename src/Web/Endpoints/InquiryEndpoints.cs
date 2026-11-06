using System.Security.Claims;
using Application.Inquiries.Commands.CreateInquiry;
using Application.Inquiries.Commands.UpdateInquiryStatus;
using Application.Inquiries.Dtos;
using Application.Inquiries.Queries.GetReceivedInquiries;
using Application.Inquiries.Queries.GetUserInquiries;
using Application.Properties.Dtos;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public record CreateInquiryRequest(Guid PropertyId, string Message, string PhoneNumber);
public record UpdateInquiryStatusRequest(string Status, string? AgentNotes);

public static class InquiryEndpoints
{
    public static void MapInquiryEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/inquiries")
            .WithTags("Inquiries")
            .RequireAuthorization();

        group.MapPost("/", async ([FromBody] CreateInquiryRequest request, ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var command = new CreateInquiryCommand
            {
                UserId = userId.Value,
                PropertyId = request.PropertyId,
                Message = request.Message,
                PhoneNumber = request.PhoneNumber
            };

            try
            {
                var result = await mediator.Send(command);
                if (result is null)
                {
                    return Results.NotFound(new { error = $"Property with ID {request.PropertyId} was not found." });
                }

                return Results.Created($"/api/inquiries/{result.Id}", result);
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
        })
        .WithName("CreateInquiry")
        .Produces<InquiryDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/my", async (ClaimsPrincipal user, [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await mediator.Send(new GetUserInquiriesQuery(userId.Value));
            return Results.Ok(result);
        })
        .WithName("GetUserInquiries")
        .Produces<List<InquiryDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/received", async (
            [FromQuery] string? status,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            ClaimsPrincipal user = default!,
            [FromServices] IMediator mediator = default!) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var query = new GetReceivedInquiriesQuery
            {
                OwnerUserId = userId.Value.ToString(),
                Status = status,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetReceivedInquiries")
        .Produces<PaginatedList<ReceivedInquiryDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}/status", async (
            Guid id,
            [FromBody] UpdateInquiryStatusRequest request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var isAdmin = user.IsInRole("Admin");

            var command = new UpdateInquiryStatusCommand
            {
                InquiryId = id,
                Status = request.Status,
                AgentNotes = request.AgentNotes,
                CurrentUserId = userId.Value.ToString(),
                IsAdmin = isAdmin
            };

            try
            {
                var result = await mediator.Send(command);
                return result.Status switch
                {
                    UpdateInquiryStatusResultStatus.NotFound => Results.NotFound(new { error = result.ErrorMessage }),
                    UpdateInquiryStatusResultStatus.Forbidden => Results.Json(new { error = result.ErrorMessage }, statusCode: StatusCodes.Status403Forbidden),
                    UpdateInquiryStatusResultStatus.Success => Results.Ok(result.Data),
                    _ => Results.StatusCode(StatusCodes.Status500InternalServerError)
                };
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
        })
        .WithName("UpdateInquiryStatus")
        .Produces<ReceivedInquiryDto>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);
    }
}

