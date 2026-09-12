namespace DomoNow.Parking.Domain.Exceptions;

public class DomainConflictException : DomainException
{
    public DomainConflictException(string message) : base(message)
    {
    }

    public DomainConflictException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
