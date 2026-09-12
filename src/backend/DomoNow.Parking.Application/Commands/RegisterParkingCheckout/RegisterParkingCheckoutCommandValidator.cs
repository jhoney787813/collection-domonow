using FluentValidation;

namespace DomoNow.Parking.Application.Commands.RegisterParkingCheckout;

public class RegisterParkingCheckoutCommandValidator : AbstractValidator<RegisterParkingCheckoutCommand>
{
    public RegisterParkingCheckoutCommandValidator()
    {
        RuleFor(x => x.AssignmentId)
            .NotEmpty().WithMessage("Assignment ID or Spot ID is required for checkout.");
    }
}
