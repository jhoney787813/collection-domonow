using DomoNow.Parking.Application.DTOs;
using MediatR;

namespace DomoNow.Parking.Application.Commands.RegisterParkingCheckout;

public record RegisterParkingCheckoutCommand(
    Guid AssignmentId,
    DateTime? ExitTime = null) : IRequest<ParkingAssignmentDto>;
