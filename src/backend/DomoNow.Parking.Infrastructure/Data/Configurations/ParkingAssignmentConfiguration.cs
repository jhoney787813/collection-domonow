using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomoNow.Parking.Infrastructure.Data.Configurations;

public class ParkingAssignmentConfiguration : IEntityTypeConfiguration<ParkingAssignment>
{
    public void Configure(EntityTypeBuilder<ParkingAssignment> builder)
    {
        builder.ToTable("parking_assignments");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .HasColumnName("id");

        builder.Property(x => x.ParkingSpotId)
            .HasColumnName("parking_spot_id")
            .IsRequired();

        builder.Property(x => x.LicensePlate)
            .HasColumnName("license_plate")
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(x => x.VisitorName)
            .HasColumnName("visitor_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.DestinationUnit)
            .HasColumnName("destination_unit")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.EntryTime)
            .HasColumnName("entry_time")
            .IsRequired();

        builder.Property(x => x.ExitTime)
            .HasColumnName("exit_time");

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<short>()
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // CRITICAL INVARIANT: Partial Unique Index
        // Guarantees mathematically that no spot can ever have more than ONE active assignment (status = 1)
        builder.HasIndex(x => x.ParkingSpotId)
            .IsUnique()
            .HasDatabaseName("uq_parking_active_assignment")
            .HasFilter("status = 1");

        builder.HasIndex(x => x.Status)
            .HasDatabaseName("idx_parking_assignments_status");

        builder.HasIndex(x => x.EntryTime)
            .HasDatabaseName("idx_parking_assignments_entry_time");

        builder.HasIndex(x => x.LicensePlate)
            .HasDatabaseName("idx_parking_assignments_plate");
    }
}
