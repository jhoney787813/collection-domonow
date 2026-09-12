using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Exceptions;
using DomoNow.Parking.Domain.Interfaces;
using MediatR;

namespace DomoNow.Parking.Application.Commands.RegisterParkingCheckout;

public class RegisterParkingCheckoutCommandHandler : IRequestHandler<RegisterParkingCheckoutCommand, ParkingAssignmentDto>
{
    private readonly IParkingAssignmentRepository _assignmentRepository;
    private readonly IParkingSpotRepository _spotRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterParkingCheckoutCommandHandler(
        IParkingAssignmentRepository assignmentRepository,
        IParkingSpotRepository spotRepository,
        IUnitOfWork unitOfWork)
    {
        _assignmentRepository = assignmentRepository;
        _spotRepository = spotRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ParkingAssignmentDto> Handle(RegisterParkingCheckoutCommand request, CancellationToken cancellationToken)
    {
        // Lookup assignment by primary ID, or fallback to active assignment on spot
        var assignment = await _assignmentRepository.GetByIdAsync(request.AssignmentId, cancellationToken);
        if (assignment == null)
        {
            assignment = await _assignmentRepository.GetActiveBySpotIdAsync(request.AssignmentId, cancellationToken);
        }

        if (assignment == null)
        {
            throw new NotFoundException("ParkingAssignment", request.AssignmentId);
        }

        // Domain method validates status and enforces temporal invariant: ExitTime >= EntryTime
        assignment.CompleteCheckout(request.ExitTime);

        var spot = await _spotRepository.GetByIdAsync(assignment.ParkingSpotId, cancellationToken);
        if (spot != null)
        {
            spot.Release();
            _spotRepository.Update(spot);
        }

        _assignmentRepository.Update(assignment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        double? duration = assignment.ExitTime.HasValue
            ? Math.Round((assignment.ExitTime.Value - assignment.EntryTime).TotalMinutes, 1)
            : null;

        return new ParkingAssignmentDto
        {
            Id = assignment.Id,
            ParkingSpotId = assignment.ParkingSpotId,
            SpotNumber = spot?.SpotNumber ?? "Unknown",
            LicensePlate = assignment.LicensePlate,
            VisitorName = assignment.VisitorName,
            DestinationUnit = assignment.DestinationUnit,
            EntryTime = assignment.EntryTime,
            ExitTime = assignment.ExitTime,
            Status = (short)assignment.Status,
            StatusName = assignment.Status.ToString(),
            DurationMinutes = duration
        };
    }
}
