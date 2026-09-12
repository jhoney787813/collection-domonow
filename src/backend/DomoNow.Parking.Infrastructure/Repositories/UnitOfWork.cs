using DomoNow.Parking.Domain.Interfaces;
using DomoNow.Parking.Infrastructure.Data;

namespace DomoNow.Parking.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ParkingDbContext _context;

    public UnitOfWork(ParkingDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
