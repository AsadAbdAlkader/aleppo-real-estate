namespace Application.Common.Security;

/// <summary>
/// Central registry of functional permissions for the Aleppo Real Estate platform.
/// Standard claim type used across JWT tokens is 'permission'.
/// </summary>
public static class Permissions
{
    public const string ClaimType = "permission";

    public static class Property
    {
        public const string View = "Property.View";
        public const string Create = "Property.Create";
        public const string Edit = "Property.Edit";
        public const string Delete = "Property.Delete";
        public const string Approve = "Property.Approve";           // Approve property listings before public display
        public const string Feature = "Property.Feature";           // Mark property as featured on hero/landing page
        public const string GlobalAccess = "Property.GlobalAccess"; // Cross-agency access across all listings
    }

    public static class Inquiry
    {
        public const string View = "Inquiry.View";
        public const string Create = "Inquiry.Create";
        public const string Respond = "Inquiry.Respond";
        public const string Manage = "Inquiry.Manage";             // Reassign inquiry or manage workflow
    }

    public static class Agency
    {
        public const string View = "Agency.View";
        public const string Create = "Agency.Create";
        public const string Edit = "Agency.Edit";
        public const string Delete = "Agency.Delete";
        public const string ManageAgents = "Agency.ManageAgents";   // Assign/remove agents to/from agency
    }

    public static class User
    {
        public const string View = "User.View";
        public const string Manage = "User.Manage";
        public const string AssignRole = "User.AssignRole";
    }

    public static class Chat
    {
        public const string Access = "Chat.Access";
        public const string Send = "Chat.Send";
    }

    public static class Dashboard
    {
        public const string ViewAgency = "Dashboard.ViewAgency";
        public const string ViewGlobal = "Dashboard.ViewGlobal";
    }
}
