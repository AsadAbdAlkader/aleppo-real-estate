using Domain.Common;

namespace Domain.Entities;

public class FavoriteProperty : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;
}
