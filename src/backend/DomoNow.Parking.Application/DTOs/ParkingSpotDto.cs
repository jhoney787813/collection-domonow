namespace DomoNow.Parking.Application.DTOs;

public record ParkingSpotDto
{
    public Guid Id { get; init; }
    public string SpotNumber { get; init; } = string.Empty;
    public short Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public ActiveAssignmentSummaryDto? CurrentAssignment { get; init; }
}
