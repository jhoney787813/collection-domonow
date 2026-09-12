using DomoNow.Parking.Domain.Exceptions;

namespace DomoNow.Parking.Domain.ValueObjects;

public sealed record DestinationUnit
{
    public string Value { get; }

    public DestinationUnit(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            throw new DomainValidationException("DestinationUnit", "Destination apartment/unit is required.");
        }

        var trimmed = rawValue.Trim();
        if (trimmed.Length > 100)
        {
            throw new DomainValidationException("DestinationUnit", "Destination unit cannot exceed 100 characters.");
        }

        Value = trimmed;
    }

    public static DestinationUnit Create(string rawValue) => new(rawValue);

    public override string ToString() => Value;

    public static implicit operator string(DestinationUnit unit) => unit.Value;
}
