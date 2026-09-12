import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingStateService } from '../services/parking.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="state.checkoutSpotTarget()" class="modal-backdrop" (click)="state.closeCheckoutModal()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-title">
            <span class="spot-pill occupied">{{ spot()?.spotNumber }}</span>
            <h3>{{ i18n.t().checkoutModalTitle }}</h3>
          </div>
          <button class="close-btn" (click)="state.closeCheckoutModal()">&times;</button>
        </div>

        <div class="modal-body" *ngIf="spot()?.currentAssignment as item">
          <div class="summary-card">
            <div class="data-row">
              <span class="data-label">{{ i18n.t().plateLabel }}</span>
              <span class="plate-tag">{{ item.licensePlate }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">{{ i18n.t().visitorNameLabel }}</span>
              <span class="data-value">{{ item.visitorName }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">{{ i18n.t().destinationLabel }}</span>
              <span class="data-value">{{ item.destinationUnit }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">{{ i18n.t().entryTimeLabel }}</span>
              <span class="data-value">{{ item.entryTime | date:'shortTime' }}</span>
            </div>
            <div class="data-row highlight">
              <span class="data-label">{{ i18n.t().elapsedTimeLabel }}</span>
              <span class="duration-badge">{{ calculateElapsed(item.entryTime) }}</span>
            </div>
          </div>

          <p class="policy-note">
            {{ i18n.t().checkoutPolicy }}
          </p>

          <div class="modal-actions">
            <button type="button" class="domo-btn-secondary" (click)="state.closeCheckoutModal()">
              {{ i18n.t().cancelBtn }}
            </button>
            <button
              type="button"
              class="domo-btn-primary checkout-btn"
              [disabled]="isSubmitting"
              (click)="onConfirmCheckout()"
            >
              {{ isSubmitting ? (i18n.currentLang() === 'en' ? 'Processing...' : 'Procesando...') : i18n.t().confirmCheckoutBtn }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-dialog {
      background: #FFFFFF;
      width: 100%;
      max-width: 460px;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(108, 53, 222, 0.25);
      border: 1px solid #E2E8F0;
      overflow: hidden;
      margin: 16px;
    }
    .modal-header {
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #F1F5F9;
      background: #F8FAFC;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0F172A;
    }
    .spot-pill.occupied {
      background: #4A1E9E;
      color: #FFFFFF;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748B;
      line-height: 1;
    }
    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .summary-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }
    .data-row.highlight {
      border-top: 1px dashed #D1D5DB;
      padding-top: 10px;
      margin-top: 4px;
    }
    .data-label {
      color: #64748B;
      font-weight: 500;
    }
    .data-value {
      color: #0F172A;
      font-weight: 600;
    }
    .plate-tag {
      background: #F3E8FF;
      color: #4A1E9E;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #DDD6FE;
    }
    .duration-badge {
      background: #EDE9FE;
      color: #5825C6;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    .policy-note {
      font-size: 0.8rem;
      color: #475569;
      margin: 0;
      line-height: 1.4;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 6px;
    }
    .checkout-btn {
      background-color: #5825C6;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class CheckoutModalComponent {
  state = inject(ParkingStateService);
  i18n = inject(I18nService);

  readonly spot = computed(() => this.state.checkoutSpotTarget());
  isSubmitting = false;

  calculateElapsed(entryTimeIso: string): string {
    const entry = new Date(entryTimeIso);
    const now = new Date();
    const diffMinutes = Math.max(1, Math.round((now.getTime() - entry.getTime()) / 60000));
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const remainingMins = diffMinutes % 60;
    return `${hours}h ${remainingMins}m`;
  }

  async onConfirmCheckout(): Promise<void> {
    const s = this.spot();
    if (!s || this.isSubmitting) return;

    this.isSubmitting = true;
    try {
      await this.state.checkoutSpot(s.id);
    } finally {
      this.isSubmitting = false;
    }
  }
}
