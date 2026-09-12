using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Domain.Interfaces;
using DomoNow.Parking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DomoNow.Parking.Infrastructure.Repositories;

public class ParkingAssignmentRepository : IParkingAssignmentRepository
{
    private readonly ParkingDbContext _context;

    public ParkingAssignmentRepository(ParkingDbContext context)
    {
        _context = context;
    }

    public async Task<ParkingAssignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.ParkingAssignments
            .Include(a => a.ParkingSpot)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<ParkingAssignment?> GetActiveBySpotIdAsync(Guid spotId, CancellationToken cancellationToken = default)
    {
        return await _context.ParkingAssignments
            .Include(a => a.ParkingSpot)
            .FirstOrDefaultAsync(a => a.ParkingSpotId == spotId && a.Status == AssignmentStatus.Active, cancellationToken);
    }

    public async Task<IReadOnlyList<ParkingAssignment>> GetActiveAssignmentsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ParkingAssignments
            .Include(a => a.ParkingSpot)
            .Where(a => a.Status == AssignmentStatus.Active)
            .OrderByDescending(a => a.EntryTime)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(ParkingAssignment assignment, CancellationToken cancellationToken = default)
    {
        await _context.ParkingAssignments.AddAsync(assignment, cancellationToken);
    }

    public void Update(ParkingAssignment assignment)
    {
        _context.ParkingAssignments.Update(assignment);
    }
}
