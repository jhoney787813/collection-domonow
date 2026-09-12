using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Application.Queries.GetParkingSpots;
using DomoNow.Parking.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DomoNow.Parking.Api.Controllers;

[ApiController]
[Route("api/parking-spots")]
[Produces("application/json")]
public class ParkingSpotsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ParkingSpotsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Retrieves visitor parking spot inventory with optional status filter.
    /// </summary>
    /// <param name="statusFilter">Filter by status (1: Available, 2: Occupied, 3: OutOfService)</param>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ParkingSpotDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ParkingSpotDto>>> GetSpots(
        [FromQuery] ParkingSpotStatus? statusFilter,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetParkingSpotsQuery(statusFilter), cancellationToken);
        return Ok(result);
    }
}
