using DomoNow.Parking.Application.DTOs;
using MediatR;

namespace DomoNow.Parking.Application.Commands.RegisterParkingEntry;

public record RegisterParkingEntryCommand(
    Guid ParkingSpotId,
    string LicensePlate,
    string VisitorName,
    string DestinationUnit) : IRequest<ParkingAssignmentDto>;
