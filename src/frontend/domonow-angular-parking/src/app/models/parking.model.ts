/**
 * DomoNow Parking Operations Domain Models (Angular 19)
 */

export type ParkingSpotStatus = 'Available' | 'Occupied' | 'OutOfService';

export interface ParkingAssignment {
  id: string;
  parkingSpotId: string;
  spotNumber: string;
  licensePlate: string;
  visitorName: string;
  destinationUnit: string;
  entryTime: string; // ISO 8601 UTC
  exitTime?: string | null;
  durationMinutes?: number | null;
  status: 'Active' | 'Completed' | 'Cancelled';
}

export interface ParkingSpot {
  id: string;
  spotNumber: string;
  status: ParkingSpotStatus;
  currentAssignment?: ParkingAssignment | null;
  updatedAt?: string;
}

export interface OperationsStats {
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  outOfServiceSpots: number;
  occupancyPercentage: number;
}

export interface DialogData {
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  statusCode?: number | string;
  detail?: string;
  confirmText?: string;
  onConfirm?: () => void;
}
