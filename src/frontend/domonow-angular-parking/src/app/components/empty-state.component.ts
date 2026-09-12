import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-card" [ngClass]="'state-' + type">
      <!-- Badge Category -->
      <div class="pill-badge" [ngClass]="'badge-' + type">
        <span class="dot-indicator"></span>
        <span>{{ badgeText }}</span>
      </div>

      <!-- Icon Container -->
      <div class="icon-bubble" [ngClass]="'bubble-' + type">
        <span *ngIf="type === 'error'">📡</span>
        <span *ngIf="type === 'empty'">🅿️</span>
        <span *ngIf="type === 'filter'">🔍</span>
      </div>

      <!-- Title & Main Message -->
      <h3 class="state-title">{{ title }}</h3>
      <p class="state-message">{{ message }}</p>

      <!-- Technical Cause Box (Optional) -->
      <div *ngIf="detail" class="detail-container">
        <div class="detail-header">
          <span class="detail-label">Diagnóstico de Conexión / Endpoint:</span>
          <span *ngIf="statusCode" class="code-badge">HTTP {{ statusCode }}</span>
        </div>
        <p class="detail-text">{{ detail }}</p>
      </div>

      <!-- Actions -->
      <div class="state-actions">
        <button
          *ngIf="showRetry"
          type="button"
          class="domo-btn-retry"
          [ngClass]="'btn-' + type"
          [disabled]="isLoading"
          (click)="onRetry.emit()"
        >
          <span *ngIf="isLoading" class="spinner"></span>
          <span>{{ isLoading ? 'Sincronizando...' : actionText }}</span>
        </button>

        <button
          *ngIf="showSecondary"
          type="button"
          class="domo-btn-secondary"
          (click)="onSecondary.emit()"
        >
          {{ secondaryText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .empty-state-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 20px;
      padding: 48px 32px;
      margin: 20px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 10px 30px -10px rgba(108, 53, 222, 0.08);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .state-error {
      border-color: #FECACA;
      background: linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 30%);
    }
    .state-empty {
      border-color: #DDD6FE;
      background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 30%);
    }
    .state-filter {
      border-color: #E2E8F0;
      background: #FFFFFF;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }
    .badge-error {
      background: #FEE2E2;
      color: #991B1B;
    }
    .badge-error .dot-indicator {
      background: #EF4444;
    }
    .badge-empty {
      background: #EDE9FE;
      color: #5825C6;
    }
    .badge-empty .dot-indicator {
      background: #6C35DE;
    }
    .badge-filter {
      background: #F1F5F9;
      color: #475569;
    }
    .badge-filter .dot-indicator {
      background: #94A3B8;
    }

    .dot-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .icon-bubble {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      margin-bottom: 18px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.04);
    }
    .bubble-error {
      background: #FEE2E2;
      border: 1.5px solid #FCA5A5;
    }
    .bubble-empty {
      background: #EDE9FE;
      border: 1.5px solid #DDD6FE;
    }
    .bubble-filter {
      background: #F1F5F9;
      border: 1.5px solid #E2E8F0;
    }

    .state-title {
      margin: 0 0 10px 0;
      font-size: 1.4rem;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.02em;
    }
    .state-message {
      margin: 0 auto 24px auto;
      max-width: 580px;
      font-size: 0.95rem;
      color: #64748B;
      line-height: 1.6;
    }

    .detail-container {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 4px solid #EF4444;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 26px;
      max-width: 640px;
      width: 100%;
      text-align: left;
    }
    .state-empty .detail-container {
      border-left-color: #6C35DE;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .detail-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .code-badge {
      background: #FEE2E2;
      color: #991B1B;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .detail-text {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.84rem;
      color: #1E293B;
      word-break: break-all;
      line-height: 1.45;
    }

    .state-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .domo-btn-retry {
      padding: 12px 26px;
      font-size: 0.92rem;
      font-weight: 700;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      color: #FFFFFF;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(108, 53, 222, 0.25);
    }
    .btn-error {
      background: #DC2626;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
    }
    .btn-error:hover:not(:disabled) {
      background: #B91C1C;
      transform: translateY(-2px);
    }
    .btn-empty, .btn-filter {
      background: linear-gradient(135deg, #6C35DE 0%, #4A1E9E 100%);
    }
    .btn-empty:hover:not(:disabled), .btn-filter:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(108, 53, 222, 0.35);
    }
    .domo-btn-retry:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .domo-btn-secondary {
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      color: #334155;
      padding: 11px 22px;
      font-size: 0.9rem;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .domo-btn-secondary:hover {
      border-color: #6C35DE;
      color: #6C35DE;
      background: #FAF5FF;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class EmptyStateComponent {
  @Input() type: 'error' | 'empty' | 'filter' = 'empty';
  @Input() badgeText = 'SIN REGISTROS';
  @Input() title = 'No hay datos disponibles';
  @Input() message = 'No se encontraron registros para cargar en este componente.';
  @Input() detail?: string;
  @Input() statusCode?: number | string;
  @Input() actionText = '🔄 Reintentar Carga';
  @Input() showRetry = true;
  @Input() isLoading = false;
  @Input() showSecondary = false;
  @Input() secondaryText = 'Cancelar';

  @Output() onRetry = new EventEmitter<void>();
  @Output() onSecondary = new EventEmitter<void>();
}
