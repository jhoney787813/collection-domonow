using System.Text.RegularExpressions;
using DomoNow.Parking.Domain.Exceptions;

namespace DomoNow.Parking.Domain.ValueObjects;

public sealed record LicensePlate
{
    private static readonly Regex PlateRegex = new(@"^[A-Z0-9]{5,8}$", RegexOptions.Compiled);

    public string Value { get; }

    public LicensePlate(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            throw new DomainValidationException("LicensePlate", "License plate is required.");
        }

        // Normalize: uppercase, strip hyphens, spaces, dots, underscores
        var normalized = rawValue
            .Trim()
            .ToUpperInvariant()
            .Replace("-", "")
            .Replace(" ", "")
            .Replace(".", "")
            .Replace("_", "");

        if (!PlateRegex.IsMatch(normalized))
        {
            throw new DomainValidationException(
                "LicensePlate", 
                $"License plate '{rawValue}' (normalized: '{normalized}') does not match required format (5-8 alphanumeric characters: ^[A-Z0-9]{{5,8}}$).");
        }

        Value = normalized;
    }

    public static LicensePlate Create(string rawValue) => new(rawValue);

    public override string ToString() => Value;

    public static implicit operator string(LicensePlate plate) => plate.Value;
}
