using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Domain.Interfaces;
using MediatR;

namespace DomoNow.Parking.Application.Queries.GetActiveAssignments;

public class GetActiveAssignmentsQueryHandler : IRequestHandler<GetActiveAssignmentsQuery, IReadOnlyList<ActiveAssignmentSummaryDto>>
{
    private readonly IParkingAssignmentRepository _assignmentRepository;
    private readonly IParkingSpotRepository _spotRepository;

    public GetActiveAssignmentsQueryHandler(
        IParkingAssignmentRepository assignmentRepository,
        IParkingSpotRepository spotRepository)
    {
        _assignmentRepository = assignmentRepository;
        _spotRepository = spotRepository;
    }

    public async Task<IReadOnlyList<ActiveAssignmentSummaryDto>> Handle(GetActiveAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var assignments = await _assignmentRepository.GetActiveAssignmentsAsync(cancellationToken);
        var spots = await _spotRepository.GetAllAsync(null, cancellationToken);
        var spotsById = spots.ToDictionary(s => s.Id);

        var now = DateTime.UtcNow;

        return assignments.Select(a =>
        {
            var spotNumber = spotsById.TryGetValue(a.ParkingSpotId, out var spot) ? spot.SpotNumber : "Unknown";
            return new ActiveAssignmentSummaryDto
            {
                Id = a.Id,
                ParkingSpotId = a.ParkingSpotId,
                SpotNumber = spotNumber,
                LicensePlate = a.LicensePlate,
                VisitorName = a.VisitorName,
                DestinationUnit = a.DestinationUnit,
                EntryTime = a.EntryTime,
                ElapsedMinutes = Math.Round((now - a.EntryTime).TotalMinutes, 1)
            };
        }).ToList();
    }
}
