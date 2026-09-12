using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Domain.Exceptions;
using DomoNow.Parking.Domain.Interfaces;
using DomoNow.Parking.Domain.ValueObjects;
using MediatR;

namespace DomoNow.Parking.Application.Commands.RegisterParkingEntry;

public class RegisterParkingEntryCommandHandler : IRequestHandler<RegisterParkingEntryCommand, ParkingAssignmentDto>
{
    private readonly IParkingSpotRepository _spotRepository;
    private readonly IParkingAssignmentRepository _assignmentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterParkingEntryCommandHandler(
        IParkingSpotRepository spotRepository,
        IParkingAssignmentRepository assignmentRepository,
        IUnitOfWork unitOfWork)
    {
        _spotRepository = spotRepository;
        _assignmentRepository = assignmentRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ParkingAssignmentDto> Handle(RegisterParkingEntryCommand request, CancellationToken cancellationToken)
    {
        var spot = await _spotRepository.GetByIdAsync(request.ParkingSpotId, cancellationToken);
        if (spot == null)
        {
            throw new NotFoundException("ParkingSpot", request.ParkingSpotId);
        }

        // Domain Value Objects normalization and validation
        var licensePlate = new LicensePlate(request.LicensePlate);
        var destinationUnit = new DestinationUnit(request.DestinationUnit);

        // Pre-check active assignment for clean domain rejection
        var existingActive = await _assignmentRepository.GetActiveBySpotIdAsync(spot.Id, cancellationToken);
        if (existingActive != null)
        {
            throw new DomainConflictException($"Parking spot '{spot.SpotNumber}' already has an active assignment for plate '{existingActive.LicensePlate}'.");
        }

        // Aggregate domain logic enforces status transition and business invariants
        var assignment = spot.Assign(licensePlate, request.VisitorName, destinationUnit);

        await _assignmentRepository.AddAsync(assignment, cancellationToken);
        _spotRepository.Update(spot);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ParkingAssignmentDto
        {
            Id = assignment.Id,
            ParkingSpotId = spot.Id,
            SpotNumber = spot.SpotNumber,
            LicensePlate = assignment.LicensePlate,
            VisitorName = assignment.VisitorName,
            DestinationUnit = assignment.DestinationUnit,
            EntryTime = assignment.EntryTime,
            ExitTime = assignment.ExitTime,
            Status = (short)assignment.Status,
            StatusName = assignment.Status.ToString(),
            DurationMinutes = null
        };
    }
}
