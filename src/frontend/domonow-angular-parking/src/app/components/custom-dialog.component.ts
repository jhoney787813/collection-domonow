import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingStateService } from '../services/parking.service';

@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="state.activeDialog() as dialog" class="dialog-backdrop" (click)="onBackdropClick($event)">
      <div class="dialog-box" [ngClass]="'dialog-' + dialog.type" (click)="$event.stopPropagation()">
        <!-- Header with Icon & Status Code -->
        <div class="dialog-header">
          <div class="dialog-icon-wrapper" [ngClass]="'icon-' + dialog.type">
            <span *ngIf="dialog.type === 'error'">🚨</span>
            <span *ngIf="dialog.type === 'warning'">⚠️</span>
            <span *ngIf="dialog.type === 'success'">✅</span>
            <span *ngIf="dialog.type === 'info'">ℹ️</span>
          </div>
          <div class="dialog-title-group">
            <div class="badge-row" *ngIf="dialog.statusCode">
              <span class="status-code-badge" [ngClass]="'status-' + dialog.type">
                HTTP {{ dialog.statusCode }}
              </span>
            </div>
            <h3 class="dialog-title">{{ dialog.title }}</h3>
          </div>
          <button class="dialog-close-btn" (click)="close()" aria-label="Cerrar">&times;</button>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          <p class="dialog-message">{{ dialog.message }}</p>
          
          <div *ngIf="dialog.detail" class="dialog-detail-box">
            <span class="detail-label">Detalle Técnico / Causa:</span>
            <p class="detail-content">{{ dialog.detail }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="dialog-actions">
          <button type="button" class="domo-btn-dialog" [ngClass]="'btn-' + dialog.type" (click)="confirm(dialog)">
            {{ dialog.confirmText || 'Entendido' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: dialogFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 16px;
    }
    .dialog-box {
      background: #FFFFFF;
      width: 100%;
      max-width: 480px;
      border-radius: 18px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0,0,0,0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: dialogZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border-top: 5px solid #6C35DE;
    }
    .dialog-error {
      border-top-color: #EF4444;
    }
    .dialog-warning {
      border-top-color: #F59E0B;
    }
    .dialog-success {
      border-top-color: #10B981;
    }
    .dialog-info {
      border-top-color: #6C35DE;
    }
    .dialog-header {
      padding: 20px 24px 14px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      position: relative;
    }
    .dialog-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .icon-error {
      background: #FEE2E2;
    }
    .icon-warning {
      background: #FEF3C7;
    }
    .icon-success {
      background: #D1FAE5;
    }
    .icon-info {
      background: #EDE9FE;
    }
    .dialog-title-group {
      flex: 1;
      padding-right: 24px;
    }
    .badge-row {
      margin-bottom: 4px;
    }
    .status-code-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }
    .status-error {
      background: #FEE2E2;
      color: #991B1B;
    }
    .status-warning {
      background: #FEF3C7;
      color: #92400E;
    }
    .status-success {
      background: #D1FAE5;
      color: #065F46;
    }
    .status-info {
      background: #EDE9FE;
      color: #5825C6;
    }
    .dialog-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.3;
    }
    .dialog-close-btn {
      position: absolute;
      top: 18px;
      right: 18px;
      background: none;
      border: none;
      font-size: 24px;
      color: #94A3B8;
      cursor: pointer;
      line-height: 1;
      padding: 4px 8px;
      border-radius: 8px;
      transition: all 0.15s;
    }
    .dialog-close-btn:hover {
      color: #0F172A;
      background: #F1F5F9;
    }
    .dialog-body {
      padding: 6px 24px 18px;
    }
    .dialog-message {
      margin: 0 0 14px;
      font-size: 0.92rem;
      color: #334155;
      line-height: 1.5;
    }
    .dialog-detail-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .detail-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .detail-content {
      margin: 0;
      font-size: 0.86rem;
      color: #1E293B;
      line-height: 1.4;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      word-break: break-word;
    }
    .dialog-actions {
      padding: 14px 24px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #F8FAFC;
      border-top: 1px solid #F1F5F9;
    }
    .domo-btn-dialog {
      padding: 10px 24px;
      font-size: 0.92rem;
      font-weight: 700;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      color: #FFFFFF;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn-error {
      background: #DC2626;
    }
    .btn-error:hover {
      background: #B91C1C;
    }
    .btn-warning {
      background: #D97706;
    }
    .btn-warning:hover {
      background: #B45309;
    }
    .btn-success {
      background: #059669;
    }
    .btn-success:hover {
      background: #047857;
    }
    .btn-info {
      background: #6C35DE;
    }
    .btn-info:hover {
      background: #5825C6;
    }

    @keyframes dialogFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes dialogZoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class CustomDialogComponent {
  state = inject(ParkingStateService);

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close();
    }
  }

  close(): void {
    this.state.closeDialog();
  }

  confirm(dialog: any): void {
    if (dialog.onConfirm) {
      dialog.onConfirm();
    }
    this.state.closeDialog();
  }
}
