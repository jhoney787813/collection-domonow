using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Enums;
using DomoNow.Parking.Domain.Interfaces;
using DomoNow.Parking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DomoNow.Parking.Infrastructure.Repositories;

public class ParkingSpotRepository : IParkingSpotRepository
{
    private readonly ParkingDbContext _context;

    public ParkingSpotRepository(ParkingDbContext context)
    {
        _context = context;
    }

    public async Task<ParkingSpot?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.ParkingSpots
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<ParkingSpot?> GetBySpotNumberAsync(string spotNumber, CancellationToken cancellationToken = default)
    {
        var normalized = spotNumber.Trim().ToUpperInvariant();
        return await _context.ParkingSpots
            .FirstOrDefaultAsync(s => s.SpotNumber == normalized, cancellationToken);
    }

    public async Task<IReadOnlyList<ParkingSpot>> GetAllAsync(ParkingSpotStatus? statusFilter = null, CancellationToken cancellationToken = default)
    {
        var query = _context.ParkingSpots.AsQueryable();

        if (statusFilter.HasValue)
        {
            query = query.Where(s => s.Status == statusFilter.Value);
        }

        return await query
            .OrderBy(s => s.SpotNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(ParkingSpot spot, CancellationToken cancellationToken = default)
    {
        await _context.ParkingSpots.AddAsync(spot, cancellationToken);
    }

    public void Update(ParkingSpot spot)
    {
        _context.ParkingSpots.Update(spot);
    }
}
