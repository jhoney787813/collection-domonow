using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomoNow.Parking.Infrastructure.Data.Configurations;

public class ParkingSpotConfiguration : IEntityTypeConfiguration<ParkingSpot>
{
    public void Configure(EntityTypeBuilder<ParkingSpot> builder)
    {
        builder.ToTable("parking_spots");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .HasColumnName("id");

        builder.Property(x => x.SpotNumber)
            .HasColumnName("spot_number")
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(x => x.SpotNumber)
            .IsUnique()
            .HasDatabaseName("uq_parking_spot_number");

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

        // Map PostgreSQL xmin system column as RowVersion for optimistic concurrency control
        builder.Property(x => x.RowVersion)
            .HasColumnName("xmin")
            .HasColumnType("xid")
            .ValueGeneratedOnAddOrUpdate()
            .IsRowVersion();

        builder.HasMany(x => x.Assignments)
            .WithOne(a => a.ParkingSpot)
            .HasForeignKey(a => a.ParkingSpotId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
