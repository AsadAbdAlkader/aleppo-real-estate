namespace Domain.Constants;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Agent = "Agent";
    public const string Buyer = "Buyer";
    public const string Owner = "Owner";

    public static readonly string[] All = [Admin, Agent, Buyer, Owner];
    public static readonly string[] PublicRegistrationRoles = [Buyer, Agent];
}
