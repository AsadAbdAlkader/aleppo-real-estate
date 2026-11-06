namespace Application.Common.Exceptions;

public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException() : base("Access is forbidden.") { }

    public ForbiddenAccessException(string message) : base(message) { }
}
