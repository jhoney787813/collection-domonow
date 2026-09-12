import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingStateService } from './services/parking.service';
import { I18nService } from './services/i18n.service';
import { ParkingGridComponent } from './components/parking-grid.component';
import { EntryModalComponent } from './components/entry-modal.component';
import { CheckoutModalComponent } from './components/checkout-modal.component';

@Component({
  selector: 'app-domonow-angular-parking',
  standalone: true,
  imports: [CommonModule, ParkingGridComponent, EntryModalComponent, CheckoutModalComponent],
  template: `
    <div class="mfe-container">
      <!-- Subproject Visual Header -->
      <header class="mfe-header">
        <div class="header-left">
          <div class="brand-pill">
            <span class="brand-sub">{{ i18n.t().brandSub }}</span>
          </div>
          <h2>{{ i18n.t().title }}</h2>
          <p class="subtitle">{{ i18n.t().subtitle }}</p>
        </div>

        <div class="header-right">
          <button
            class="concurrency-btn"
            (click)="onSimulateConcurrency()"
            title="Concurrency stress test"
          >
            {{ i18n.t().concurrencyBtn }}
          </button>
        </div>
      </header>

      <!-- Concurrency Test Live Notification -->
      <div *ngIf="state.concurrencyNotice()" class="concurrency-alert">
        <span class="alert-icon">🛡️</span>
        <span class="alert-text">{{ state.concurrencyNotice() }}</span>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card total">
          <span class="kpi-title">{{ i18n.t().kpiTotalSpots }}</span>
          <span class="kpi-value">{{ state.stats().totalSpots }}</span>
          <span class="kpi-tag">{{ i18n.t().kpiMaxCapacity }}</span>
        </div>

        <div class="kpi-card available">
          <span class="kpi-title">{{ i18n.t().kpiAvailable }}</span>
          <span class="kpi-value">{{ state.stats().availableSpots }}</span>
          <span class="kpi-tag available-tag">{{ i18n.t().kpiReadyToAssign }}</span>
        </div>

        <div class="kpi-card occupied">
          <span class="kpi-title">{{ i18n.t().kpiOccupied }}</span>
          <span class="kpi-value">{{ state.stats().occupiedSpots }}</span>
          <span class="kpi-tag occupied-tag">{{ state.stats().occupancyPercentage }}{{ i18n.t().kpiOccupancyRate }}</span>
        </div>

        <div class="kpi-card out">
          <span class="kpi-title">{{ i18n.t().kpiOutOfService }}</span>
          <span class="kpi-value">{{ state.stats().outOfServiceSpots }}</span>
          <span class="kpi-tag out-tag">{{ i18n.t().kpiMaintenance }}</span>
        </div>
      </div>

      <!-- Controls & Filter Toolbar -->
      <div class="toolbar">
        <div class="filter-group">
          <span class="filter-label">{{ i18n.t().filterLabel }}</span>
          <button
            class="filter-chip"
            [class.active]="state.selectedFilter() === 'ALL'"
            (click)="state.setFilter('ALL')"
          >
            {{ i18n.t().filterAll }} ({{ state.stats().totalSpots }})
          </button>
          <button
            class="filter-chip chip-available"
            [class.active]="state.selectedFilter() === 'Available'"
            (click)="state.setFilter('Available')"
          >
            {{ i18n.t().statusAvailable }} ({{ state.stats().availableSpots }})
          </button>
          <button
            class="filter-chip chip-occupied"
            [class.active]="state.selectedFilter() === 'Occupied'"
            (click)="state.setFilter('Occupied')"
          >
            {{ i18n.t().statusOccupied }} ({{ state.stats().occupiedSpots }})
          </button>
          <button
            class="filter-chip chip-out"
            [class.active]="state.selectedFilter() === 'OutOfService'"
            (click)="state.setFilter('OutOfService')"
          >
            {{ i18n.t().statusOutOfService }} ({{ state.stats().outOfServiceSpots }})
          </button>
        </div>
      </div>

      <!-- 30-Spot Grid -->
      <app-parking-grid></app-parking-grid>

      <!-- Interactive Modals -->
      <app-entry-modal></app-entry-modal>
      <app-checkout-modal></app-checkout-modal>
    </div>
  `,
  styles: [`
    .mfe-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
    }
    .mfe-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-pill {
      display: inline-block;
      margin-bottom: 6px;
    }
    .brand-sub {
      background: #EDE9FE;
      color: #5825C6;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    .mfe-header h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 4px 0 0 0;
      color: #64748B;
      font-size: 0.9rem;
    }
    .concurrency-btn {
      background: linear-gradient(135deg, #6C35DE 0%, #4A1E9E 100%);
      color: #FFFFFF;
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(108, 53, 222, 0.35);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .concurrency-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(108, 53, 222, 0.45);
    }
    .concurrency-alert {
      background: #FAF5FF;
      border: 1.5px solid #C4B5FD;
      color: #4A1E9E;
      padding: 12px 18px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideDown 0.3s ease-out;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .kpi-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748B;
    }
    .kpi-value {
      font-size: 2rem;
      font-weight: 800;
      color: #0F172A;
      margin: 4px 0;
      line-height: 1.1;
    }
    .kpi-tag {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748B;
    }
    .available-tag {
      color: #059669;
    }
    .occupied-tag {
      color: #5825C6;
    }
    .out-tag {
      color: #64748B;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: #64748B;
      margin-right: 4px;
    }
    .filter-chip {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      color: #334155;
      transition: all 0.15s ease;
    }
    .filter-chip:hover {
      border-color: #CBD5E1;
      background: #F8FAFC;
    }
    .filter-chip.active {
      background: #6C35DE;
      color: #FFFFFF;
      border-color: #6C35DE;
      box-shadow: 0 2px 8px rgba(108, 53, 222, 0.25);
    }
    .chip-available.active {
      background: #10B981;
      border-color: #10B981;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }
    .chip-occupied.active {
      background: #4A1E9E;
      border-color: #4A1E9E;
      box-shadow: 0 2px 8px rgba(74, 30, 158, 0.25);
    }
    .chip-out.active {
      background: #64748B;
      border-color: #64748B;
      box-shadow: 0 2px 8px rgba(100, 116, 139, 0.25);
    }
    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class AppComponent {
  state = inject(ParkingStateService);
  i18n = inject(I18nService);

  onSimulateConcurrency(): void {
    const isEn = this.i18n.currentLang() === 'en';
    const runningMsg = isEn
      ? 'Simulating 10 concurrent requests targeting bay P-15...'
      : 'Simulando 10 peticiones concurrentes simultáneas hacia el cupo P-15...';
    const resultMsg = isEn
      ? 'Concurrency Result for P-15: 1 Successful Allocation (201 Created) and 9 Rejected as Conflict (409 Conflict)! Invariant uq_parking_active_assignment preserved.'
      : 'Resultado de Concurrencia para P-15: ¡1 Asignación Exitosa (201 Created) y 9 Rechazadas por Conflicto (409 Conflict)! Invariante uq_parking_active_assignment preservado.';

    this.state.simulateConcurrencyRace('P-15', runningMsg, resultMsg);
  }
}
