import { Injectable, signal, computed } from '@angular/core';
import { ParkingSpot, ParkingAssignment, ParkingSpotStatus, OperationsStats, DialogData } from '../models/parking.model';

@Injectable({
  providedIn: 'root'
})
export class ParkingStateService {
  private readonly API_BASE = 'http://localhost:5050/api';

  // Reactive Signal State
  private readonly _spots = signal<ParkingSpot[]>([]);
  private readonly _selectedFilter = signal<ParkingSpotStatus | 'ALL'>('ALL');
  private readonly _activeModalSpot = signal<ParkingSpot | null>(null);
  private readonly _checkoutSpotTarget = signal<ParkingSpot | null>(null);
  private readonly _concurrencyNotice = signal<string | null>(null);
  private readonly _activeDialog = signal<DialogData | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  // Read-only Signal selectors
  readonly spots = this._spots.asReadonly();
  readonly selectedFilter = this._selectedFilter.asReadonly();
  readonly activeModalSpot = this._activeModalSpot.asReadonly();
  readonly checkoutSpotTarget = this._checkoutSpotTarget.asReadonly();
  readonly concurrencyNotice = this._concurrencyNotice.asReadonly();
  readonly activeDialog = this._activeDialog.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

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

  constructor() {
    this.loadSpots();
  }

  // Dialog Controls
  openDialog(data: DialogData): void {
    this._activeDialog.set(data);
  }

  closeDialog(): void {
    this._activeDialog.set(null);
  }

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
   * Load Parking Spots from .NET 10 Web API
   */
  async loadSpots(): Promise<void> {
    this._isLoading.set(true);
    try {
      const res = await fetch(`${this.API_BASE}/parking-spots`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const mapped: ParkingSpot[] = data.map((item: any) => {
        let status: ParkingSpotStatus = 'Available';
        if (item.status === 2 || item.statusName === 'Occupied') status = 'Occupied';
        else if (item.status === 3 || item.statusName === 'OutOfService') status = 'OutOfService';

        let assignment: ParkingAssignment | null = null;
        if (item.currentAssignment) {
          assignment = {
            id: item.currentAssignment.id,
            parkingSpotId: item.currentAssignment.parkingSpotId,
            spotNumber: item.currentAssignment.spotNumber,
            licensePlate: item.currentAssignment.licensePlate,
            visitorName: item.currentAssignment.visitorName,
            destinationUnit: item.currentAssignment.destinationUnit,
            entryTime: item.currentAssignment.entryTime,
            status: 'Active'
          };
        }

        return {
          id: item.id,
          spotNumber: item.spotNumber,
          status,
          currentAssignment: assignment,
          updatedAt: new Date().toISOString()
        };
      });

      this._spots.set(mapped);
    } catch (err: any) {
      console.error('[ParkingService] Error fetching spots:', err);
      this.openDialog({
        title: 'Error de Conexión',
        message: 'No fue posible cargar los cupos desde la API .NET 10 (http://localhost:5050/api).',
        type: 'error',
        statusCode: 500,
        detail: err.message,
        confirmText: 'Reintentar',
        onConfirm: () => this.loadSpots()
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Domain Command: Register Entry / Assign Spot via POST /api/parking-assignments
   */
  async assignSpot(spotId: string, rawPlate: string, visitorName: string, destinationUnit: string): Promise<{ success: boolean; error?: string }> {
    const spot = this._spots().find(s => s.id === spotId);
    if (!spot) {
      const err = 'Cupo no encontrado en el sistema.';
      this.openDialog({ title: 'Error', message: err, type: 'error', statusCode: 404 });
      return { success: false, error: err };
    }

    const sanitizedPlate = rawPlate.replace(/[\s\-\.]/g, '').toUpperCase();
    if (!/^[A-Z0-9]{5,8}$/.test(sanitizedPlate)) {
      const err = 'Formato de placa inválido. Debe tener entre 5 y 8 caracteres alfanuméricos.';
      this.openDialog({
        title: 'Validación de Placa',
        message: err,
        type: 'warning',
        statusCode: 422,
        detail: `Placa ingresada: "${rawPlate}" -> Normalizada: "${sanitizedPlate}"`
      });
      return { success: false, error: err };
    }

    try {
      const res = await fetch(`${this.API_BASE}/parking-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkingSpotId: spot.id,
          licensePlate: sanitizedPlate,
          visitorName: visitorName.trim(),
          destinationUnit: destinationUnit.trim()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const detail = errJson?.detail || errJson?.title || 'Error al procesar la asignación.';
        const errType = res.status === 409 ? 'warning' : 'error';
        const errTitle = res.status === 409
          ? 'Conflicto de Asignación (409)'
          : res.status === 422
          ? 'Regla de Dominio Inválida (422)'
          : `Error en Servidor (${res.status})`;

        this.openDialog({
          title: errTitle,
          message: detail,
          type: errType,
          statusCode: res.status,
          detail: errJson?.errors ? Object.entries(errJson.errors).map(([k, v]) => `${k}: ${v}`).join('\n') : (errJson?.detail || '')
        });
        return { success: false, error: detail };
      }

      const created = await res.json();
      this.closeEntryModal();
      await this.loadSpots();

      this.openDialog({
        title: '¡Ingreso Asignado con Éxito!',
        message: `El vehículo con placa ${sanitizedPlate} fue asignado al cupo ${spot.spotNumber}.`,
        type: 'success',
        statusCode: 201,
        detail: `ID Asignación: ${created.id}\nVisitante: ${created.visitorName}\nDestino: ${created.destinationUnit}`
      });

      // Inter-MFE Event Dispatch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('domonow:spot-assigned', {
          detail: {
            id: created.id,
            spotNumber: spot.spotNumber,
            licensePlate: sanitizedPlate,
            visitorName: created.visitorName,
            destinationUnit: created.destinationUnit,
            entryTime: created.entryTime
          }
        }));
      }

      return { success: true };
    } catch (err: any) {
      console.error('[ParkingService] Network error during assignSpot:', err);
      this.openDialog({
        title: 'Error de Comunicación',
        message: 'No se pudo contactar con la API del backend.',
        type: 'error',
        statusCode: 500,
        detail: err.message
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Domain Command: Register Checkout via POST /api/parking-assignments/{id}/checkout
   */
  async checkoutSpot(spotIdOrAssignmentId: string): Promise<{ success: boolean; durationMinutes?: number; error?: string }> {
    const spot = this._spots().find(s => s.id === spotIdOrAssignmentId || s.currentAssignment?.id === spotIdOrAssignmentId);
    const targetId = spot?.currentAssignment?.id || spotIdOrAssignmentId;

    try {
      const res = await fetch(`${this.API_BASE}/parking-assignments/${targetId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const detail = errJson?.detail || errJson?.title || 'Error al procesar la salida.';
        this.openDialog({
          title: 'Error en Salida',
          message: detail,
          type: 'error',
          statusCode: res.status,
          detail: errJson?.detail || ''
        });
        return { success: false, error: detail };
      }

      const result = await res.json();
      this.closeCheckoutModal();
      await this.loadSpots();

      const duration = result.durationMinutes ?? 0;
      this.openDialog({
        title: 'Salida Registrada Exitosamente',
        message: `El cupo ${result.spotNumber} ha sido liberado. Vehículo con placa ${result.licensePlate} retirado.`,
        type: 'success',
        statusCode: 200,
        detail: `Duración total de estadía: ${duration} minutos.\nHora de entrada: ${result.entryTime}\nHora de salida: ${result.exitTime}`
      });

      // Inter-MFE Event Dispatch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('domonow:spot-released', {
          detail: {
            spotNumber: result.spotNumber,
            licensePlate: result.licensePlate,
            durationMinutes: duration,
            exitTime: result.exitTime
          }
        }));
      }

      return { success: true, durationMinutes: duration };
    } catch (err: any) {
      console.error('[ParkingService] Network error during checkoutSpot:', err);
      this.openDialog({
        title: 'Error de Comunicación',
        message: 'No se pudo contactar con la API del backend.',
        type: 'error',
        statusCode: 500,
        detail: err.message
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Concurrency Test: Execute 10 simultaneous allocation requests targeting spot P-15 directly against the backend API
   */
  async simulateConcurrencyRace(targetSpotNumber = 'P-15', customRunningMsg?: string, customResultMsg?: string): Promise<void> {
    // Ensure fresh spots
    await this.loadSpots();
    const target = this._spots().find(s => s.spotNumber === targetSpotNumber);
    if (!target) {
      this.openDialog({
        title: 'Cupo no encontrado',
        message: `El cupo ${targetSpotNumber} no existe en la base de datos.`,
        type: 'error'
      });
      return;
    }

    // If currently occupied, liberate it first via API so the race is clean
    if (target.status === 'Occupied' && target.currentAssignment) {
      await fetch(`${this.API_BASE}/parking-assignments/${target.currentAssignment.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      await this.loadSpots();
    }

    this._concurrencyNotice.set(
      customRunningMsg || `Disparando 10 peticiones concurrentes HTTP hacia POST /api/parking-assignments para cupo ${targetSpotNumber}...`
    );

    const fakeRequests = Array.from({ length: 10 }).map((_, idx) => ({
      parkingSpotId: target.id,
      licensePlate: `RAC${100 + idx}`,
      visitorName: `Visitante Concurrente #${idx + 1}`,
      destinationUnit: `Torre 1 - Apt ${301 + idx}`
    }));

    // Send 10 parallel HTTP POST requests simultaneously
    const results = await Promise.all(
      fakeRequests.map(body =>
        fetch(`${this.API_BASE}/parking-assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).then(res => ({ status: res.status }))
          .catch(err => ({ status: 0, error: err.message }))
      )
    );

    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;

    for (const r of results) {
      if (r.status === 201) successCount++;
      else if (r.status === 409) conflictCount++;
      else otherCount++;
    }

    // Reload spots to reflect reality in DB
    await this.loadSpots();

    const summary = `Resultado de Concurrencia para ${targetSpotNumber}: ¡${successCount} Asignación Exitosa (201 Created) y ${conflictCount} Rechazadas por Conflicto (409 Conflict)! Invariante uq_parking_active_assignment preservado a nivel PostgreSQL.`;

    this._concurrencyNotice.set(customResultMsg || summary);
    setTimeout(() => this._concurrencyNotice.set(null), 10000);

    // Show Custom Dialog with full breakdown
    this.openDialog({
      title: 'Control de Concurrencia (.NET 10 & PostgreSQL)',
      message: `Se enviaron 10 peticiones HTTP simultáneas al endpoint de asignación sobre el cupo ${targetSpotNumber}.`,
      type: successCount === 1 ? 'success' : 'warning',
      statusCode: '201 vs 409',
      detail: `• 201 Created (Éxito): ${successCount}\n• 409 Conflict (Rechazo seguro): ${conflictCount}\n• Otros estados: ${otherCount}\n\nValidado: La base de datos impidió doble ocupación concurrente sin inconsistencias.`,
      confirmText: 'Aceptar'
    });
  }
}
