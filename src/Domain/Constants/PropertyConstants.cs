namespace Domain.Constants;

public static class PropertyStatuses
{
    public const string Available = "Available";
    public const string Published = "Published";
    public const string PendingReview = "PendingReview";
    public const string Draft = "Draft";
    public const string Reserved = "Reserved";
    public const string Sold = "Sold";
    public const string Rented = "Rented";
    public const string Archived = "Archived";

    public static readonly string[] PubliclyVisible = [Published, Available];
}

public static class PropertyPurposes
{
    public const string Sale = "Sale";
    public const string Rent = "Rent";

    public static readonly string[] All = [Sale, Rent];
}

public static class PropertyCategories
{
    public const string Apartment = "Apartment";
    public const string Villa = "Villa";
    public const string Land = "Land";
    public const string Commercial = "Commercial";
    public const string Office = "Office";

    public static readonly string[] All = [Apartment, Villa, Land, Commercial, Office];
}
