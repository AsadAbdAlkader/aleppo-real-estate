namespace Domain.Constants;

public static class InquiryStatuses
{
    public const string New = "New";
    public const string InProgress = "InProgress";
    public const string Contacted = "Contacted";
    public const string Closed = "Closed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] AllowedUpdateStatuses = [New, Contacted, Closed];
}
