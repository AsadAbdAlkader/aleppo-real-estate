namespace Application.Common.Security;

/// <summary>
/// Specifies the class this attribute is applied to requires authorization.
/// Supports both Role and dynamic Permission Policy.
/// </summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = true)]
public class AuthorizeAttribute : Attribute
{
    public AuthorizeAttribute() { }

    public string Roles { get; set; } = string.Empty;

    public string Policy { get; set; } = string.Empty;
}
