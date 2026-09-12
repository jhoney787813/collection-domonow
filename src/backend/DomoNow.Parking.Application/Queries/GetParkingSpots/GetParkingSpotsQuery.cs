using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Domain.Enums;
using MediatR;

namespace DomoNow.Parking.Application.Queries.GetParkingSpots;

public record GetParkingSpotsQuery(ParkingSpotStatus? StatusFilter = null) : IRequest<IReadOnlyList<ParkingSpotDto>>;
