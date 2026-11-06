namespace Application.Common.Security;

/// <summary>
/// Predefined role-to-permission mapping implementing Separation of Duties.
/// System Administrator is separated from operational agency activities unless explicitly granted.
/// </summary>
public static class DefaultRolePermissions
{
    private static readonly Dictionary<string, HashSet<string>> _rolePermissions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Admin"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Property.View,
            Permissions.Property.Create,
            Permissions.Property.Edit,
            Permissions.Property.Delete,
            Permissions.Property.Approve,
            Permissions.Property.Feature,
            Permissions.Property.GlobalAccess,
            Permissions.Inquiry.View,
            Permissions.Inquiry.Respond,
            Permissions.Inquiry.Manage,
            Permissions.Agency.View,
            Permissions.Agency.Create,
            Permissions.Agency.Edit,
            Permissions.Agency.Delete,
            Permissions.Agency.ManageAgents,
            Permissions.User.View,
            Permissions.User.Manage,
            Permissions.User.AssignRole,
            Permissions.Chat.Access,
            Permissions.Chat.Send,
            Permissions.Dashboard.ViewGlobal,
            Permissions.Dashboard.ViewAgency
        },

        ["AgencyManager"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Property.View,
            Permissions.Property.Create,
            Permissions.Property.Edit,
            Permissions.Property.Delete,
            Permissions.Property.Approve,
            Permissions.Property.Feature,
            Permissions.Inquiry.View,
            Permissions.Inquiry.Respond,
            Permissions.Inquiry.Manage,
            Permissions.Agency.View,
            Permissions.Agency.ManageAgents,
            Permissions.Chat.Access,
            Permissions.Chat.Send,
            Permissions.Dashboard.ViewAgency
        },

        ["Agent"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Property.View,
            Permissions.Property.Create,
            Permissions.Property.Edit,
            Permissions.Property.Delete,
            Permissions.Inquiry.View,
            Permissions.Inquiry.Respond,
            Permissions.Agency.View,
            Permissions.Chat.Access,
            Permissions.Chat.Send
        },

        ["Owner"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Property.View,
            Permissions.Property.Create,
            Permissions.Property.Edit,
            Permissions.Property.Delete,
            Permissions.Inquiry.View,
            Permissions.Inquiry.Respond,
            Permissions.Chat.Access,
            Permissions.Chat.Send
        },

        ["Buyer"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            Permissions.Property.View,
            Permissions.Inquiry.View,
            Permissions.Inquiry.Create,
            Permissions.Chat.Access,
            Permissions.Chat.Send
        }
    };

    public static IReadOnlyCollection<string> GetPermissionsForRole(string role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return Array.Empty<string>();
        }

        if (_rolePermissions.TryGetValue(role, out var permissions))
        {
            return permissions;
        }

        return Array.Empty<string>();
    }

    public static IReadOnlyCollection<string> GetEffectivePermissions(IEnumerable<string> roles)
    {
        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var role in roles)
        {
            foreach (var perm in GetPermissionsForRole(role))
            {
                result.Add(perm);
            }
        }

        return result;
    }
}
