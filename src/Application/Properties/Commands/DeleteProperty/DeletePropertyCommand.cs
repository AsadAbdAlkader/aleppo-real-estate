using Application.Common.Interfaces;
using Application.Properties.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Properties.Commands.DeleteProperty;

public record DeletePropertyCommand(Guid Id, string CurrentUserId, bool IsAdmin) : IRequest<DeletePropertyResult>;

public class DeletePropertyCommandHandler : IRequestHandler<DeletePropertyCommand, DeletePropertyResult>
{
    private readonly IApplicationDbContext _context;

    public DeletePropertyCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DeletePropertyResult> Handle(DeletePropertyCommand request, CancellationToken cancellationToken)
    {
        var property = await _context.Properties
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (property == null)
        {
            return DeletePropertyResult.NotFound($"Property with ID {request.Id} was not found.");
        }

        var isOwner = !string.IsNullOrEmpty(property.OwnerId) &&
                      property.OwnerId.Equals(request.CurrentUserId, StringComparison.OrdinalIgnoreCase);

        if (!isOwner && !request.IsAdmin)
        {
            return DeletePropertyResult.Forbidden("You do not have permission to delete this property.");
        }

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync(cancellationToken);

        return DeletePropertyResult.Success();
    }
}
