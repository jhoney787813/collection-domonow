using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Domain.Exceptions;
using DomoNow.Parking.Domain.ValueObjects;

namespace DomoNow.Parking.Domain.Entities;

public class ParkingSpot
{
    public Guid Id { get; private set; }
    public string SpotNumber { get; private set; } = string.Empty;
    public ParkingSpotStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    
    // Concurrency token mapped to PostgreSQL system column xmin
    public uint RowVersion { get; private set; }

    // Navigation collection
    private readonly List<ParkingAssignment> _assignments = new();
    public IReadOnlyCollection<ParkingAssignment> Assignments => _assignments.AsReadOnly();

    // Parameterless constructor for EF Core
    private ParkingSpot() { }

    public ParkingSpot(string spotNumber)
    {
        if (string.IsNullOrWhiteSpace(spotNumber))
        {
            throw new DomainValidationException("SpotNumber", "Spot number is required.");
        }

        Id = Guid.NewGuid();
        SpotNumber = spotNumber.Trim().ToUpperInvariant();
        Status = ParkingSpotStatus.Available;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public ParkingAssignment Assign(LicensePlate licensePlate, string visitorName, DestinationUnit destinationUnit)
    {
        if (Status == ParkingSpotStatus.Occupied)
        {
            throw new DomainConflictException($"Parking spot '{SpotNumber}' is already occupied.");
        }

        if (Status == ParkingSpotStatus.OutOfService)
        {
            throw new DomainValidationException("Status", $"Parking spot '{SpotNumber}' is out of service and cannot be allocated.");
        }

        if (string.IsNullOrWhiteSpace(visitorName))
        {
            throw new DomainValidationException("VisitorName", "Visitor name is required.");
        }

        Status = ParkingSpotStatus.Occupied;
        UpdatedAt = DateTime.UtcNow;

        var assignment = new ParkingAssignment(
            parkingSpotId: Id,
            licensePlate: licensePlate.Value,
            visitorName: visitorName.Trim(),
            destinationUnit: destinationUnit.Value);

        _assignments.Add(assignment);
        return assignment;
    }

    public void Release()
    {
        Status = ParkingSpotStatus.Available;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkOutOfService()
    {
        if (Status == ParkingSpotStatus.Occupied)
        {
            throw new DomainConflictException($"Cannot mark occupied parking spot '{SpotNumber}' as out of service.");
        }

        Status = ParkingSpotStatus.OutOfService;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAvailable()
    {
        Status = ParkingSpotStatus.Available;
        UpdatedAt = DateTime.UtcNow;
    }
}
