using FluentValidation;

namespace DomoNow.Parking.Application.Commands.RegisterParkingEntry;

public class RegisterParkingEntryCommandValidator : AbstractValidator<RegisterParkingEntryCommand>
{
    public RegisterParkingEntryCommandValidator()
    {
        RuleFor(x => x.ParkingSpotId)
            .NotEmpty().WithMessage("Parking spot ID is required.");

        RuleFor(x => x.LicensePlate)
            .NotEmpty().WithMessage("License plate is required.")
            .Matches(@"^[A-Za-z0-9\-.\s]{5,10}$")
            .WithMessage("License plate must contain 5 to 8 alphanumeric characters (ignoring hyphens and spaces).");

        RuleFor(x => x.VisitorName)
            .NotEmpty().WithMessage("Visitor name is required.")
            .MaximumLength(100).WithMessage("Visitor name cannot exceed 100 characters.");

        RuleFor(x => x.DestinationUnit)
            .NotEmpty().WithMessage("Destination apartment/unit is required.")
            .MaximumLength(100).WithMessage("Destination unit cannot exceed 100 characters.");
    }
}
