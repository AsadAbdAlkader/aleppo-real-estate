namespace Application.Common.Exceptions;

public class AgencyScopeViolationException : Exception
{
    public const string ErrorCode = "SEC-SCOPE-VIOLATION";

    public AgencyScopeViolationException() 
        : base("Access denied: You do not have permission to access resources outside your assigned agency scope.") { }

    public AgencyScopeViolationException(string message) : base(message) { }
}
