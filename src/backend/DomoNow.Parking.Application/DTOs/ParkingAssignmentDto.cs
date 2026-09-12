namespace DomoNow.Parking.Application.DTOs;

public record ParkingAssignmentDto
{
    public Guid Id { get; init; }
    public Guid ParkingSpotId { get; init; }
    public string SpotNumber { get; init; } = string.Empty;
    public string LicensePlate { get; init; } = string.Empty;
    public string VisitorName { get; init; } = string.Empty;
    public string DestinationUnit { get; init; } = string.Empty;
    public DateTime EntryTime { get; init; }
    public DateTime? ExitTime { get; init; }
    public short Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public double? DurationMinutes { get; init; }
}
