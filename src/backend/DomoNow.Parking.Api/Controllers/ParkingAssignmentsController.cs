using DomoNow.Parking.Application.Commands.RegisterParkingCheckout;
using DomoNow.Parking.Application.Commands.RegisterParkingEntry;
using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Application.Queries.GetActiveAssignments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DomoNow.Parking.Api.Controllers;

[ApiController]
[Route("api/parking-assignments")]
[Produces("application/json")]
public class ParkingAssignmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ParkingAssignmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Registers entry of a visitor vehicle, allocating the designated parking spot.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ParkingAssignmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ParkingAssignmentDto>> RegisterEntry(
        [FromBody] RegisterParkingEntryCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>
    /// Completes the departure/checkout of an active parking assignment.
    /// </summary>
    [HttpPost("{id:guid}/checkout")]
    [ProducesResponseType(typeof(ParkingAssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ParkingAssignmentDto>> RegisterCheckout(
        [FromRoute] Guid id,
        [FromBody] CheckoutRequest? request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterParkingCheckoutCommand(id, request?.ExitTime);
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves all currently active visitor vehicle parking assignments.
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(IReadOnlyList<ActiveAssignmentSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ActiveAssignmentSummaryDto>>> GetActive(
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetActiveAssignmentsQuery(), cancellationToken);
        return Ok(result);
    }
}

public record CheckoutRequest(DateTime? ExitTime);
