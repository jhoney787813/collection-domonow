using DomoNow.Parking.Domain.Entities;

namespace DomoNow.Parking.Domain.Interfaces;

public interface IParkingAssignmentRepository
{
    Task<ParkingAssignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ParkingAssignment?> GetActiveBySpotIdAsync(Guid spotId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ParkingAssignment>> GetActiveAssignmentsAsync(CancellationToken cancellationToken = default);
    Task AddAsync(ParkingAssignment assignment, CancellationToken cancellationToken = default);
    void Update(ParkingAssignment assignment);
}
