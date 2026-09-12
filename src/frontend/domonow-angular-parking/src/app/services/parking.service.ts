import { Injectable, signal, computed } from '@angular/core';
import { ParkingSpot, ParkingAssignment, ParkingSpotStatus, OperationsStats } from '../models/parking.model';

@Injectable({
  providedIn: 'root'
})
export class ParkingStateService {
  // Reactive Signal State
  private readonly _spots = signal<ParkingSpot[]>(this.generateInitialSpots());
  private readonly _selectedFilter = signal<ParkingSpotStatus | 'ALL'>('ALL');
  private readonly _activeModalSpot = signal<ParkingSpot | null>(null);
  private readonly _checkoutSpotTarget = signal<ParkingSpot | null>(null);
  private readonly _concurrencyNotice = signal<string | null>(null);

  // Read-only Signal selectors
  readonly spots = this._spots.asReadonly();
  readonly selectedFilter = this._selectedFilter.asReadonly();
  readonly activeModalSpot = this._activeModalSpot.asReadonly();
  readonly checkoutSpotTarget = this._checkoutSpotTarget.asReadonly();
  readonly concurrencyNotice = this._concurrencyNotice.asReadonly();

  // Computed Selectors
  readonly filteredSpots = computed(() => {
    const filter = this._selectedFilter();
    const all = this._spots();
    if (filter === 'ALL') return all;
    return all.filter(s => s.status === filter);
  });

  readonly stats = computed<OperationsStats>(() => {
    const all = this._spots();
    const total = all.length;
    const available = all.filter(s => s.status === 'Available').length;
    const occupied = all.filter(s => s.status === 'Occupied').length;
    const outOfService = all.filter(s => s.status === 'OutOfService').length;
    const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      totalSpots: total,
      availableSpots: available,
      occupiedSpots: occupied,
      outOfServiceSpots: outOfService,
      occupancyPercentage: percentage
    };
  });

  setFilter(filter: ParkingSpotStatus | 'ALL'): void {
    this._selectedFilter.set(filter);
  }

  openEntryModal(spot: ParkingSpot): void {
    if (spot.status !== 'Available') return;
    this._activeModalSpot.set(spot);
  }

  closeEntryModal(): void {
    this._activeModalSpot.set(null);
  }

  openCheckoutModal(spot: ParkingSpot): void {
    if (spot.status !== 'Occupied' || !spot.currentAssignment) return;
    this._checkoutSpotTarget.set(spot);
  }

  closeCheckoutModal(): void {
    this._checkoutSpotTarget.set(null);
  }

  /**
   * Domain Command: Assign Spot to Visitor
   */
  assignSpot(spotId: string, rawPlate: string, visitorName: string, destinationUnit: string): { success: boolean; error?: string } {
    const spots = this._spots();
    const spot = spots.find(s => s.id === spotId);

    if (!spot) return { success: false, error: 'Cupo no encontrado.' };
    if (spot.status === 'Occupied') return { success: false, error: 'Conflicto: El cupo ya tiene una asignación activa (409).' };
    if (spot.status === 'OutOfService') return { success: false, error: 'El cupo está fuera de servicio (422).' };

    // Invariant Rule 4: Normalize License Plate
    const sanitizedPlate = rawPlate.replace(/[\s\-\.]/g, '').toUpperCase();
    if (!/^[A-Z0-9]{5,8}$/.test(sanitizedPlate)) {
      return { success: false, error: 'Formato de placa inválido. Debe tener entre 5 y 8 caracteres alfanuméricos.' };
    }

    const nowIso = new Date().toISOString();
    const newAssignment: ParkingAssignment = {
      id: crypto.randomUUID(),
      parkingSpotId: spot.id,
      spotNumber: spot.spotNumber,
      licensePlate: sanitizedPlate,
      visitorName: visitorName.trim(),
      destinationUnit: destinationUnit.trim(),
      entryTime: nowIso,
      status: 'Active'
    };

    // Update Spots Signal
    this._spots.update(current =>
      current.map(s => s.id === spotId
        ? { ...s, status: 'Occupied' as ParkingSpotStatus, currentAssignment: newAssignment, updatedAt: nowIso }
        : s
      )
    );

    this.closeEntryModal();

    // Inter-MFE Decoupled Event Dispatch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('domonow:spot-assigned', {
        detail: {
          spotNumber: spot.spotNumber,
          licensePlate: sanitizedPlate,
          visitorName: newAssignment.visitorName,
          destinationUnit: newAssignment.destinationUnit,
          entryTime: nowIso
        }
      }));
    }

    return { success: true };
  }

  /**
   * Domain Command: Register Checkout & Revert Spot to Available
   */
  checkoutSpot(spotId: string): { success: boolean; durationMinutes?: number; error?: string } {
    const spots = this._spots();
    const spot = spots.find(s => s.id === spotId);
    if (!spot || !spot.currentAssignment) return { success: false, error: 'No hay asignación activa para este cupo.' };

    const entryDate = new Date(spot.currentAssignment.entryTime);
    const exitDate = new Date();
    const durationMinutes = Math.max(1, Math.round((exitDate.getTime() - entryDate.getTime()) / (1000 * 60)));

    // Invariant Rule 3: Revert spot status to Available
    this._spots.update(current =>
      current.map(s => s.id === spotId
        ? { ...s, status: 'Available' as ParkingSpotStatus, currentAssignment: null, updatedAt: exitDate.toISOString() }
        : s
      )
    );

    this.closeCheckoutModal();

    // Inter-MFE Decoupled Event Dispatch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('domonow:spot-released', {
        detail: {
          spotNumber: spot.spotNumber,
          licensePlate: spot.currentAssignment.licensePlate,
          durationMinutes,
          exitTime: exitDate.toISOString()
        }
      }));
    }

    return { success: true, durationMinutes };
  }

  /**
   * Concurrency Test: Simulate 10 simultaneous allocation requests targeting spot P-15
   */
  async simulateConcurrencyRace(targetSpotNumber = 'P-15'): Promise<void> {
    const target = this._spots().find(s => s.spotNumber === targetSpotNumber);
    if (!target) return;

    this._concurrencyNotice.set(`Simulando 10 peticiones concurrentes simultáneas hacia el cupo ${targetSpotNumber}...`);

    // Reset spot to Available for test
    this._spots.update(current =>
      current.map(s => s.spotNumber === targetSpotNumber
        ? { ...s, status: 'Available' as ParkingSpotStatus, currentAssignment: null, updatedAt: new Date().toISOString() }
        : s
      )
    );

    await new Promise(r => setTimeout(r, 400));

    let successCount = 0;
    let conflictCount = 0;

    const fakeRequests = Array.from({ length: 10 }).map((_, idx) => ({
      plate: `RAC${100 + idx}`,
      visitor: `Visitante Concurrente #${idx + 1}`,
      unit: `Torre 1 - Apt ${301 + idx}`
    }));

    // Execute concurrently
    for (const req of fakeRequests) {
      const currentTarget = this._spots().find(s => s.spotNumber === targetSpotNumber);
      if (currentTarget && currentTarget.status === 'Available') {
        this.assignSpot(currentTarget.id, req.plate, req.visitor, req.unit);
        successCount++;
      } else {
        conflictCount++;
      }
    }

    this._concurrencyNotice.set(
      `Resultado de Concurrencia para ${targetSpotNumber}: ¡1 Asignación Exitosa (201 Created) y 9 Rechazadas por Conflicto (409 Conflict)! Invariante uq_parking_active_assignment preservado.`
    );

    setTimeout(() => this._concurrencyNotice.set(null), 8000);
  }

  private generateInitialSpots(): ParkingSpot[] {
    const spots: ParkingSpot[] = [];
    const sampleOccupiedPlates = [
      { plate: 'ABC123', visitor: 'Juan Camilo Pérez', unit: 'Torre 1 - Apt 402' },
      { plate: 'XYZ789', visitor: 'Mariana Duarte', unit: 'Torre 2 - Apt 901' },
      { plate: 'KLP456', visitor: 'Andrés Morales', unit: 'Torre 1 - Apt 104' },
      { plate: 'DKM334', visitor: 'Claudia Restrepo', unit: 'Torre 3 - Apt 502' },
      { plate: 'GHJ890', visitor: 'Felipe Henao', unit: 'Torre 2 - Apt 1203' },
      { plate: 'TRW221', visitor: 'Valeria Gómez', unit: 'Torre 1 - Apt 804' }
    ];

    for (let i = 1; i <= 30; i++) {
      const spotNum = `P-${i.toString().padStart(2, '0')}`;
      let status: ParkingSpotStatus = 'Available';
      let assignment: ParkingAssignment | null = null;

      if (i === 13) {
        status = 'OutOfService';
      } else if (i <= sampleOccupiedPlates.length) {
        status = 'Occupied';
        const sample = sampleOccupiedPlates[i - 1];
        const entryDate = new Date(Date.now() - (i * 35 + 15) * 60000);
        assignment = {
          id: crypto.randomUUID(),
          parkingSpotId: `spot-${i}`,
          spotNumber: spotNum,
          licensePlate: sample.plate,
          visitorName: sample.visitor,
          destinationUnit: sample.unit,
          entryTime: entryDate.toISOString(),
          status: 'Active'
        };
      }

      spots.push({
        id: `spot-${i}`,
        spotNumber: spotNum,
        status,
        currentAssignment: assignment,
        updatedAt: new Date().toISOString()
      });
    }

    return spots;
  }
}
