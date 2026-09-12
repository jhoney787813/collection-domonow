using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Domain.Interfaces;
using MediatR;

namespace DomoNow.Parking.Application.Queries.GetParkingSpots;

public class GetParkingSpotsQueryHandler : IRequestHandler<GetParkingSpotsQuery, IReadOnlyList<ParkingSpotDto>>
{
    private readonly IParkingSpotRepository _spotRepository;
    private readonly IParkingAssignmentRepository _assignmentRepository;

    public GetParkingSpotsQueryHandler(
        IParkingSpotRepository spotRepository,
        IParkingAssignmentRepository assignmentRepository)
    {
        _spotRepository = spotRepository;
        _assignmentRepository = assignmentRepository;
    }

    public async Task<IReadOnlyList<ParkingSpotDto>> Handle(GetParkingSpotsQuery request, CancellationToken cancellationToken)
    {
        var spots = await _spotRepository.GetAllAsync(request.StatusFilter, cancellationToken);
        var activeAssignments = await _assignmentRepository.GetActiveAssignmentsAsync(cancellationToken);
        var assignmentsBySpot = activeAssignments.ToDictionary(a => a.ParkingSpotId);

        var now = DateTime.UtcNow;

        return spots.Select(spot =>
        {
            assignmentsBySpot.TryGetValue(spot.Id, out var active);
            ActiveAssignmentSummaryDto? summary = null;

            if (active != null)
            {
                summary = new ActiveAssignmentSummaryDto
                {
                    Id = active.Id,
                    ParkingSpotId = spot.Id,
                    SpotNumber = spot.SpotNumber,
                    LicensePlate = active.LicensePlate,
                    VisitorName = active.VisitorName,
                    DestinationUnit = active.DestinationUnit,
                    EntryTime = active.EntryTime,
                    ElapsedMinutes = Math.Round((now - active.EntryTime).TotalMinutes, 1)
                };
            }

            return new ParkingSpotDto
            {
                Id = spot.Id,
                SpotNumber = spot.SpotNumber,
                Status = (short)spot.Status,
                StatusName = spot.Status.ToString(),
                CurrentAssignment = summary
            };
        }).ToList();
    }
}
