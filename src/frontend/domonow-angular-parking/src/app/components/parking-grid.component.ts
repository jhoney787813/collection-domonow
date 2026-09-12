import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingStateService } from '../services/parking.service';
import { ParkingSpot } from '../models/parking.model';

@Component({
  selector: 'app-parking-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid-container">
      <div
        *ngFor="let spot of state.filteredSpots()"
        class="spot-card"
        [ngClass]="'status-' + spot.status.toLowerCase()"
      >
        <div class="spot-card-top">
          <span class="spot-id-badge">{{ spot.spotNumber }}</span>
          <span class="domo-badge" [ngClass]="'domo-badge-' + spot.status.toLowerCase()">
            <span class="domo-badge-dot"></span>
            {{ formatStatus(spot.status) }}
          </span>
        </div>

        <!-- Occupied Details -->
        <div *ngIf="spot.status === 'Occupied' && spot.currentAssignment as assign" class="occupancy-info">
          <div class="plate-container">
            <span class="plate-number">{{ assign.licensePlate }}</span>
          </div>
          <div class="visitor-details">
            <div class="detail-row">
              <span class="icon">👤</span>
              <span class="truncate">{{ assign.visitorName }}</span>
            </div>
            <div class="detail-row">
              <span class="icon">🏢</span>
              <span class="truncate">{{ assign.destinationUnit }}</span>
            </div>
          </div>
        </div>

        <!-- Available Placeholder -->
        <div *ngIf="spot.status === 'Available'" class="available-info">
          <div class="pulse-indicator"></div>
          <span class="available-text">Cupo Libre</span>
        </div>

        <!-- Out of Service Placeholder -->
        <div *ngIf="spot.status === 'OutOfService'" class="out-info">
          <span class="out-text">Mantenimiento / Bloqueado</span>
        </div>

        <!-- Action Button -->
        <div class="spot-card-bottom">
          <button
            *ngIf="spot.status === 'Available'"
            class="action-btn assign-btn"
            (click)="state.openEntryModal(spot)"
          >
            + Asignar Ingreso
          </button>
          <button
            *ngIf="spot.status === 'Occupied'"
            class="action-btn checkout-btn"
            (click)="state.openCheckoutModal(spot)"
          >
            Registrar Salida
          </button>
          <span *ngIf="spot.status === 'OutOfService'" class="disabled-tag">
            No disponible
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .spot-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 175px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .spot-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -3px rgba(108, 53, 222, 0.1);
    }
    .status-available {
      border-top: 3px solid #10B981;
    }
    .status-occupied {
      border-top: 3px solid #6C35DE;
      background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 35%);
    }
    .status-outofservice {
      border-top: 3px solid #94A3B8;
      background: #F8FAFC;
      opacity: 0.85;
    }
    .spot-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .spot-id-badge {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.02em;
    }
    .domo-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .domo-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .domo-badge-available {
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .domo-badge-available .domo-badge-dot {
      background: #10B981;
    }
    .domo-badge-occupied {
      background: #F3E8FF;
      color: #4A1E9E;
      border: 1px solid #DDD6FE;
    }
    .domo-badge-occupied .domo-badge-dot {
      background: #6C35DE;
    }
    .domo-badge-outofservice {
      background: #F1F5F9;
      color: #475569;
      border: 1px solid #CBD5E1;
    }
    .domo-badge-outofservice .domo-badge-dot {
      background: #94A3B8;
    }
    .occupancy-info {
      margin: 10px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .plate-container {
      display: flex;
      align-items: center;
    }
    .plate-number {
      font-family: 'Courier New', monospace;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #4A1E9E;
      background: #EDE9FE;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #DDD6FE;
    }
    .visitor-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.775rem;
      color: #475569;
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }
    .available-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 20px 0;
      color: #059669;
      font-weight: 600;
      font-size: 0.825rem;
    }
    .pulse-indicator {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 2s infinite;
    }
    .out-info {
      margin: 20px 0;
      font-size: 0.775rem;
      color: #64748B;
      font-style: italic;
    }
    .spot-card-bottom {
      margin-top: auto;
    }
    .action-btn {
      width: 100%;
      padding: 8px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .assign-btn {
      background: #6C35DE;
      color: #FFFFFF;
    }
    .assign-btn:hover {
      background: #5825C6;
      box-shadow: 0 4px 10px rgba(108, 53, 222, 0.25);
    }
    .checkout-btn {
      background: #F3E8FF;
      color: #4A1E9E;
      border: 1px solid #DDD6FE;
    }
    .checkout-btn:hover {
      background: #EDE9FE;
      color: #381282;
    }
    .disabled-tag {
      display: block;
      text-align: center;
      font-size: 0.75rem;
      color: #94A3B8;
      font-weight: 600;
      padding: 6px;
    }
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
      }
      70% {
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }
  `]
})
export class ParkingGridComponent {
  state = inject(ParkingStateService);

  formatStatus(status: string): string {
    switch (status) {
      case 'Available': return 'Disponible';
      case 'Occupied': return 'Ocupado';
      case 'OutOfService': return 'Fuera de Servicio';
      default: return status;
    }
  }
}
