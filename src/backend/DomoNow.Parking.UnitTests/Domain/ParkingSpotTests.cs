using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Domain.Exceptions;
using DomoNow.Parking.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace DomoNow.Parking.UnitTests.Domain;

public class ParkingSpotTests
{
    [Fact]
    public void AssignSpot_WhenAvailable_ShouldSucceedAndMarkOccupied()
    {
        // Arrange
        var spot = new ParkingSpot("P-01");
        var plate = new LicensePlate("ABC123");
        var unit = new DestinationUnit("Torre 1 - Apt 101");
        var visitor = "Carlos Ruiz";

        // Act
        var assignment = spot.Assign(plate, visitor, unit);

        // Assert
        spot.Status.Should().Be(ParkingSpotStatus.Occupied);
        assignment.Should().NotBeNull();
        assignment.ParkingSpotId.Should().Be(spot.Id);
        assignment.LicensePlate.Should().Be("ABC123");
        assignment.VisitorName.Should().Be("Carlos Ruiz");
        assignment.DestinationUnit.Should().Be("Torre 1 - Apt 101");
        assignment.Status.Should().Be(AssignmentStatus.Active);
        assignment.EntryTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        assignment.ExitTime.Should().BeNull();
    }

    [Fact]
    public void AssignSpot_WhenAlreadyOccupied_ShouldThrowDomainConflictException()
    {
        // Arrange
        var spot = new ParkingSpot("P-02");
        spot.Assign(new LicensePlate("ABC123"), "Visitante 1", new DestinationUnit("101"));

        // Act
        var act = () => spot.Assign(new LicensePlate("XYZ789"), "Visitante 2", new DestinationUnit("102"));

        // Assert
        act.Should().Throw<DomainConflictException>()
            .WithMessage("*already occupied*");
    }

    [Fact]
    public void AssignSpot_WhenOutOfService_ShouldThrowDomainValidationException()
    {
        // Arrange
        var spot = new ParkingSpot("P-03");
        spot.MarkOutOfService();

        // Act
        var act = () => spot.Assign(new LicensePlate("ABC123"), "Visitante 1", new DestinationUnit("101"));

        // Assert
        act.Should().Throw<DomainValidationException>()
            .WithMessage("*out of service*");
    }

    [Fact]
    public void CompleteCheckout_WhenActive_ShouldSetAvailableAndRecordExit()
    {
        // Arrange
        var spot = new ParkingSpot("P-04");
        var assignment = spot.Assign(new LicensePlate("ABC123"), "Visitante 1", new DestinationUnit("101"));
        var exitTime = DateTime.UtcNow.AddMinutes(45);

        // Act
        assignment.CompleteCheckout(exitTime);
        spot.Release();

        // Assert
        assignment.Status.Should().Be(AssignmentStatus.Completed);
        assignment.ExitTime.Should().Be(exitTime);
        spot.Status.Should().Be(ParkingSpotStatus.Available);
    }

    [Fact]
    public void CompleteCheckout_WhenExitDateBeforeEntry_ShouldFailTemporalRule()
    {
        // Arrange
        var spot = new ParkingSpot("P-05");
        var assignment = spot.Assign(new LicensePlate("ABC123"), "Visitante 1", new DestinationUnit("101"));
        var pastExitTime = assignment.EntryTime.AddMinutes(-30);

        // Act
        var act = () => assignment.CompleteCheckout(pastExitTime);

        // Assert
        act.Should().Throw<DomainValidationException>()
            .WithMessage("*cannot be earlier than entry time*");
    }

    [Theory]
    [InlineData("abc-123", "ABC123")]
    [InlineData(" ABC 123 ", "ABC123")]
    [InlineData("abc.123", "ABC123")]
    [InlineData("xyz_789", "XYZ789")]
    [InlineData("kln542", "KLN542")]
    public void LicensePlate_Normalization_ShouldSanitizeHyphensAndSpaces(string input, string expected)
    {
        // Act
        var plate = new LicensePlate(input);

        // Assert
        plate.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("AB")]          // Too short (< 5)
    [InlineData("ABCDEFGHIJK")] // Too long (> 8)
    [InlineData("ABC*123")]     // Invalid special character
    public void LicensePlate_WhenInvalidFormat_ShouldThrowDomainValidationException(string input)
    {
        // Act
        var act = () => new LicensePlate(input);

        // Assert
        act.Should().Throw<DomainValidationException>();
    }
}
