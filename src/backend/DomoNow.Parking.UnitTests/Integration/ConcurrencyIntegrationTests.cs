using System.Net;
using System.Net.Http.Json;
using DomoNow.Parking.Application.Commands.RegisterParkingEntry;
using DomoNow.Parking.Application.DTOs;
using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Infrastructure.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DomoNow.Parking.UnitTests.Integration;

public class ConcurrencyIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ConcurrencyIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task RegisterParkingEntry_TenConcurrentRequestsOnSameSpot_ExactlyOneSucceedsNineFailWith409()
    {
        // Arrange: Obtain client and ensure spot P-15 exists and is available
        var client = _factory.CreateClient();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ParkingDbContext>();

            var spot15 = await db.ParkingSpots.FirstOrDefaultAsync(s => s.SpotNumber == "P-15");
            if (spot15 == null)
            {
                spot15 = new DomoNow.Parking.Domain.Entities.ParkingSpot("P-15");
                await db.ParkingSpots.AddAsync(spot15);
            }

            // Remove previous active assignments for clean test isolation
            var existingAssignments = await db.ParkingAssignments
                .Where(a => a.ParkingSpotId == spot15.Id && a.Status == AssignmentStatus.Active)
                .ToListAsync();

            foreach (var old in existingAssignments)
            {
                old.CompleteCheckout(DateTime.UtcNow);
            }

            spot15.Release();
            await db.SaveChangesAsync();
        }

        // Retrieve spot ID via GET /api/parking-spots
        var spots = await client.GetFromJsonAsync<List<ParkingSpotDto>>("/api/parking-spots");
        spots.Should().NotBeNull();
        var targetSpot = spots!.First(s => s.SpotNumber == "P-15");

        // Act: Dispatch 10 simultaneous asynchronous HTTP POST requests
        var tasks = Enumerable.Range(1, 10).Select(i =>
        {
            var command = new RegisterParkingEntryCommand(
                targetSpot.Id,
                $"RAC{i:D3}",
                $"Concurrente Driver {i}",
                $"Torre 1 Apt {100 + i}");

            return client.PostAsJsonAsync("/api/parking-assignments", command);
        }).ToList();

        var responses = await Task.WhenAll(tasks);

        // Assert:
        // 1. Exactly 1 request completes with HTTP 201 Created
        var createdResponses = responses.Where(r => r.StatusCode == HttpStatusCode.Created).ToList();
        createdResponses.Should().HaveCount(1, "only a single transaction can claim the spot under race conditions");

        // 2. Exactly 9 requests fail with HTTP 409 Conflict
        var conflictResponses = responses.Where(r => r.StatusCode == HttpStatusCode.Conflict).ToList();
        conflictResponses.Should().HaveCount(9, "all other 9 concurrent attempts must be rejected with HTTP 409 Conflict");

        // 3. Database verification: verify exactly 1 active assignment row exists for P-15
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ParkingDbContext>();
            var activeCount = await db.ParkingAssignments
                .CountAsync(a => a.ParkingSpotId == targetSpot.Id && a.Status == AssignmentStatus.Active);

            activeCount.Should().Be(1, "PostgreSQL partial unique index uq_parking_active_assignment guarantees single active occupancy");
        }
    }
}
