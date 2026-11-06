using System.Reflection;

namespace Application.Common.Security;

public static class PermissionRegistry
{
    private static readonly Lazy<HashSet<string>> _allPermissions = new(() =>
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var nestedTypes = typeof(Permissions).GetNestedTypes(BindingFlags.Public | BindingFlags.Static);

        foreach (var type in nestedTypes)
        {
            var fields = type.GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy);
            foreach (var field in fields)
            {
                if (field.IsLiteral && !field.IsInitOnly && field.FieldType == typeof(string))
                {
                    var val = (string?)field.GetValue(null);
                    if (!string.IsNullOrWhiteSpace(val))
                    {
                        set.Add(val);
                    }
                }
            }
        }

        return set;
    });

    public static IReadOnlySet<string> All => _allPermissions.Value;

    public static bool IsValid(string permission) =>
        !string.IsNullOrWhiteSpace(permission) && All.Contains(permission);
}
