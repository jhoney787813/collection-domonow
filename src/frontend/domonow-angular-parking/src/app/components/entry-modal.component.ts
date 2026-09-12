import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingStateService } from '../services/parking.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-entry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="state.activeModalSpot()" class="modal-backdrop" (click)="state.closeEntryModal()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-title">
            <span class="spot-pill">{{ state.activeModalSpot()?.spotNumber }}</span>
            <h3>{{ i18n.t().entryModalTitle }}</h3>
          </div>
          <button class="close-btn" (click)="state.closeEntryModal()">&times;</button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-form">
          <div class="form-group">
            <label for="plateInput">{{ i18n.t().licensePlateLabel }} <span class="required">*</span></label>
            <div class="input-with-badge">
              <input
                id="plateInput"
                type="text"
                name="plate"
                [(ngModel)]="plate"
                (ngModelChange)="onPlateChange($event)"
                [placeholder]="i18n.t().licensePlatePlaceholder"
                maxlength="8"
                class="domo-input"
                required
                autocomplete="off"
              />
              <span class="badge-hint" [class.valid]="isPlateValid">
                {{ isPlateValid ? i18n.t().plateValidHint : i18n.t().plateInvalidHint }}
              </span>
            </div>
            <span class="helper-text">{{ i18n.t().plateHelper }}</span>
          </div>

          <div class="form-group">
            <label for="visitorInput">{{ i18n.t().visitorLabel }} <span class="required">*</span></label>
            <input
              id="visitorInput"
              type="text"
              name="visitor"
              [(ngModel)]="visitorName"
              [placeholder]="i18n.t().visitorPlaceholder"
              maxlength="100"
              class="domo-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="unitInput">{{ i18n.t().unitLabel }} <span class="required">*</span></label>
            <input
              id="unitInput"
              type="text"
              name="unit"
              [(ngModel)]="destinationUnit"
              [placeholder]="i18n.t().unitPlaceholder"
              maxlength="100"
              class="domo-input"
              required
            />
          </div>

          <div *ngIf="errorMessage" class="error-banner">
            {{ errorMessage }}
          </div>

          <div class="modal-actions">
            <button type="button" class="domo-btn-secondary" (click)="state.closeEntryModal()">
              {{ i18n.t().cancelBtn }}
            </button>
            <button
              type="submit"
              class="domo-btn-primary"
              [disabled]="!isFormValid || isSubmitting"
            >
              {{ isSubmitting ? (i18n.currentLang() === 'en' ? 'Processing...' : 'Procesando...') : i18n.t().submitEntryBtn }}
            </button>
          </div>
        </form>
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
      max-width: 480px;
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
      background: #FAF5FF;
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
    .spot-pill {
      background: #6C35DE;
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
    .modal-form {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.825rem;
      font-weight: 600;
      color: #334155;
    }
    .required {
      color: #EF4444;
    }
    .domo-input {
      border: 1.5px solid #CBD5E1;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .domo-input:focus {
      border-color: #6C35DE;
      box-shadow: 0 0 0 3px rgba(108, 53, 222, 0.12);
    }
    .input-with-badge {
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .badge-hint {
      position: absolute;
      right: 10px;
      top: 10px;
      font-size: 0.7rem;
      color: #64748B;
      background: #F1F5F9;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .badge-hint.valid {
      background: #ECFDF5;
      color: #065F46;
      font-weight: 600;
    }
    .helper-text {
      font-size: 0.72rem;
      color: #64748B;
    }
    .error-banner {
      background: #FEF2F2;
      border: 1px solid #FCA5A5;
      color: #991B1B;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 500;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 10px;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class EntryModalComponent {
  state = inject(ParkingStateService);
  i18n = inject(I18nService);

  plate = '';
  visitorName = '';
  destinationUnit = '';
  errorMessage = '';
  isSubmitting = false;

  get isPlateValid(): boolean {
    const sanitized = this.plate.replace(/[\s\-\.]/g, '').toUpperCase();
    return /^[A-Z0-9]{5,8}$/.test(sanitized);
  }

  get isFormValid(): boolean {
    return this.isPlateValid && this.visitorName.trim().length >= 2 && this.destinationUnit.trim().length >= 1;
  }

  onPlateChange(val: string): void {
    this.plate = val.toUpperCase();
    this.errorMessage = '';
  }

  async onSubmit(): Promise<void> {
    const spot = this.state.activeModalSpot();
    if (!spot || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const res = await this.state.assignSpot(spot.id, this.plate, this.visitorName, this.destinationUnit);
      if (!res.success) {
        this.errorMessage = res.error || (this.i18n.currentLang() === 'en' ? 'Error assigning entry.' : 'Error al registrar ingreso.');
      } else {
        this.plate = '';
        this.visitorName = '';
        this.destinationUnit = '';
        this.errorMessage = '';
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
