using System.Security.Claims;
using Application.Chat.Commands.SendChatMessage;
using Application.Chat.Dtos;
using Application.Chat.Queries.GetConversationMessages;
using Application.Chat.Queries.GetMyConversations;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Web.Endpoints;

public static class ChatEndpoints
{
    public static void MapChatEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/chat")
            .WithTags("Chat")
            .RequireAuthorization();

        group.MapGet("/conversations", async (
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var query = new GetMyConversationsQuery(userId.Value.ToString());
            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetMyConversations")
        .Produces<List<ChatConversationDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/messages/{otherUserId}", async (
            string otherUserId,
            [FromQuery] Guid? propertyId,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var query = new GetConversationMessagesQuery(userId.Value.ToString(), otherUserId, propertyId);
            var result = await mediator.Send(query);
            return Results.Ok(result);
        })
        .WithName("GetConversationMessages")
        .Produces<List<ChatMessageDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/send", async (
            [FromBody] SendChatMessageRequestDto request,
            ClaimsPrincipal user,
            [FromServices] IMediator mediator) =>
        {
            var userId = user.GetUserId();
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var command = new SendChatMessageCommand(
                userId.Value.ToString(),
                request.ReceiverId,
                request.PropertyId,
                request.Message
            );

            var result = await mediator.Send(command);

            if (result is null)
            {
                return Results.NotFound(new { error = $"Receiver with ID '{request.ReceiverId}' was not found." });
            }

            return Results.Ok(result);
        })
        .WithName("SendChatMessage")
        .Produces<ChatMessageDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);
    }
}
