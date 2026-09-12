using DomoNow.Parking.Application.DTOs;
using MediatR;

namespace DomoNow.Parking.Application.Queries.GetActiveAssignments;

public record GetActiveAssignmentsQuery : IRequest<IReadOnlyList<ActiveAssignmentSummaryDto>>;
