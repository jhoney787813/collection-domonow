using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DomoNow.Parking.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedDataAsync(ParkingDbContext context, ILogger? logger = null)
    {
        try
        {
            // 1. Ensure all 30 parking spots exist
            var existingSpots = await context.ParkingSpots.ToListAsync();
            if (existingSpots.Count == 0)
            {
                logger?.LogInformation("Seeding 30 communal parking spots (P-01 to P-30)...");
                for (int i = 1; i <= 30; i++)
                {
                    var spot = new ParkingSpot($"P-{i:D2}");
                    await context.ParkingSpots.AddAsync(spot);
                }
                await context.SaveChangesAsync();
                existingSpots = await context.ParkingSpots.ToListAsync();
            }

            // 2. Check if assignments already exist. If so, do not overwrite.
            var hasAssignments = await context.ParkingAssignments.AnyAsync();
            if (hasAssignments)
            {
                logger?.LogInformation("Database already contains parking assignments. Seeding skipped.");
                return;
            }

            logger?.LogInformation("Seeding initial test visitor parking assignments and statuses...");

            var spotsByNumber = existingSpots.ToDictionary(s => s.SpotNumber);

            // 3. Mark maintenance spots
            if (spotsByNumber.TryGetValue("P-29", out var spot29))
            {
                spot29.MarkOutOfService();
            }
            if (spotsByNumber.TryGetValue("P-30", out var spot30))
            {
                spot30.MarkOutOfService();
            }

            // 4. Seed Active Assignments (bays become Occupied)
            var activeSeeds = new[]
            {
                ("P-07", "DMO101", "Ana María López", "Torre 1 - Apt 402", TimeSpan.FromMinutes(45)),
                ("P-09", "COL823", "Carlos Andrés Pérez", "Torre 2 - Apt 1004", TimeSpan.FromHours(2)),
                ("P-11", "VAL777", "Valentina Gómez", "Torre 3 - Apt 201", TimeSpan.FromMinutes(18)),
                ("P-13", "BOG456", "Fernando Morales", "Torre 1 - Apt 805", TimeSpan.FromMinutes(195)),
                ("P-15", "MED902", "Mariana Restrepo", "Torre 2 - Apt 503", TimeSpan.FromMinutes(70)),
                ("P-17", "CRA314", "Santiago Castro", "Torre 4 - Apt 1102", TimeSpan.FromMinutes(35)),
                ("P-28", "DOM2026", "Julián David Herrera", "Torre 1 - Apt 304", TimeSpan.FromMinutes(50)),
            };

            var now = DateTime.UtcNow;

            foreach (var (spotNum, plate, visitor, unit, elapsed) in activeSeeds)
            {
                if (spotsByNumber.TryGetValue(spotNum, out var spot))
                {
                    var assignment = spot.Assign(new LicensePlate(plate), visitor, new DestinationUnit(unit));
                    // Adjust entry time to simulate past entry
                    typeof(ParkingAssignment).GetProperty(nameof(ParkingAssignment.EntryTime))?
                        .SetValue(assignment, now - elapsed);

                    await context.ParkingAssignments.AddAsync(assignment);
                }
            }

            // 5. Seed Historical Completed Assignments (for Analytics & Metrics)
            var completedSeeds = new[]
            {
                ("P-01", "KLR890", "Pedro Nel Ospina", "Torre 1 - Apt 201", TimeSpan.FromHours(6), TimeSpan.FromHours(4.5)),
                ("P-02", "MNB234", "Claudia Marcela Rios", "Torre 3 - Apt 602", TimeSpan.FromHours(7), TimeSpan.FromHours(5)),
                ("P-04", "QWE567", "Gustavo Adolfo Buitrago", "Torre 2 - Apt 801", TimeSpan.FromHours(8), TimeSpan.FromHours(6.25)),
                ("P-05", "TYU901", "Andrea Catalina Ruiz", "Torre 4 - Apt 305", TimeSpan.FromHours(5), TimeSpan.FromHours(3.75)),
                ("P-08", "OPL345", "Juan Camilo Vargas", "Torre 1 - Apt 1101", TimeSpan.FromHours(4), TimeSpan.FromHours(2.16)),
                ("P-10", "ZXC678", "Diana Patricia Muñoz", "Torre 3 - Apt 404", TimeSpan.FromHours(9), TimeSpan.FromHours(7.33)),
                ("P-12", "ASD123", "Esteban Duque Jaramillo", "Torre 2 - Apt 903", TimeSpan.FromHours(3), TimeSpan.FromHours(1.25)),
                ("P-14", "GHJ789", "Laura Sofia Cárdenas", "Torre 4 - Apt 502", TimeSpan.FromHours(5.5), TimeSpan.FromHours(3.0)),
            };

            foreach (var (spotNum, plate, visitor, unit, entryOffset, exitOffset) in completedSeeds)
            {
                if (spotsByNumber.TryGetValue(spotNum, out var spot))
                {
                    var entryTime = now - entryOffset;
                    var exitTime = now - exitOffset;

                    // Construct completed assignment
                    var assignment = new ParkingAssignment(
                        spot.Id,
                        new LicensePlate(plate).Value,
                        visitor,
                        new DestinationUnit(unit).Value,
                        entryTime);

                    assignment.CompleteCheckout(exitTime);

                    await context.ParkingAssignments.AddAsync(assignment);
                }
            }

            await context.SaveChangesAsync();
            logger?.LogInformation("Seeding completed successfully with 7 active and 8 historical completed assignments.");
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "An error occurred while seeding initial test data.");
        }
    }
}
