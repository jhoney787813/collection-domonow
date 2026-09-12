using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Domain.Exceptions;

namespace DomoNow.Parking.Domain.Entities;

public class ParkingAssignment
{
    public Guid Id { get; private set; }
    public Guid ParkingSpotId { get; private set; }
    public string LicensePlate { get; private set; } = string.Empty;
    public string VisitorName { get; private set; } = string.Empty;
    public string DestinationUnit { get; private set; } = string.Empty;
    public DateTime EntryTime { get; private set; }
    public DateTime? ExitTime { get; private set; }
    public AssignmentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation property
    public virtual ParkingSpot? ParkingSpot { get; private set; }

    // Parameterless constructor for EF Core
    private ParkingAssignment() { }

    internal ParkingAssignment(Guid parkingSpotId, string licensePlate, string visitorName, string destinationUnit, DateTime? entryTime = null)
    {
        Id = Guid.NewGuid();
        ParkingSpotId = parkingSpotId;
        LicensePlate = licensePlate;
        VisitorName = visitorName;
        DestinationUnit = destinationUnit;
        EntryTime = entryTime ?? DateTime.UtcNow;
        Status = AssignmentStatus.Active;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CompleteCheckout(DateTime? exitTime = null)
    {
        if (Status != AssignmentStatus.Active)
        {
            throw new DomainValidationException("Status", "Only active assignments can be checked out.");
        }

        var effectiveExitTime = exitTime ?? DateTime.UtcNow;

        if (effectiveExitTime < EntryTime)
        {
            throw new DomainValidationException(
                "ExitTime", 
                $"Exit time ({effectiveExitTime:O}) cannot be earlier than entry time ({EntryTime:O}).");
        }

        ExitTime = effectiveExitTime;
        Status = AssignmentStatus.Completed;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        if (Status != AssignmentStatus.Active)
        {
            throw new DomainValidationException("Status", "Only active assignments can be cancelled.");
        }

        Status = AssignmentStatus.Cancelled;
        ExitTime = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
