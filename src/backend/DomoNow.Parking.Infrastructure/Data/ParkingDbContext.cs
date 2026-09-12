using DomoNow.Parking.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DomoNow.Parking.Infrastructure.Data;

public class ParkingDbContext : DbContext
{
    public DbSet<ParkingSpot> ParkingSpots => Set<ParkingSpot>();
    public DbSet<ParkingAssignment> ParkingAssignments => Set<ParkingAssignment>();

    public ParkingDbContext(DbContextOptions<ParkingDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ParkingDbContext).Assembly);
    }
}
