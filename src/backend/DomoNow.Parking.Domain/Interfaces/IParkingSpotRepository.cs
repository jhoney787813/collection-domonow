using DomoNow.Parking.Domain.Entities;
using DomoNow.Parking.Domain.Enums;

namespace DomoNow.Parking.Domain.Interfaces;

public interface IParkingSpotRepository
{
    Task<ParkingSpot?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ParkingSpot?> GetBySpotNumberAsync(string spotNumber, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ParkingSpot>> GetAllAsync(ParkingSpotStatus? statusFilter = null, CancellationToken cancellationToken = default);
    Task AddAsync(ParkingSpot spot, CancellationToken cancellationToken = default);
    void Update(ParkingSpot spot);
}
