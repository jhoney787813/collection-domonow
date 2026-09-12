namespace DomoNow.Parking.Application.DTOs;

public record ActiveAssignmentSummaryDto
{
    public Guid Id { get; init; }
    public Guid ParkingSpotId { get; init; }
    public string SpotNumber { get; init; } = string.Empty;
    public string LicensePlate { get; init; } = string.Empty;
    public string VisitorName { get; init; } = string.Empty;
    public string DestinationUnit { get; init; } = string.Empty;
    public DateTime EntryTime { get; init; }
    public double ElapsedMinutes { get; init; }
}
