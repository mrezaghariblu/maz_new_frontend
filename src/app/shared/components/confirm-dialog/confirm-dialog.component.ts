import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'maz-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .dialog {
      background: #fff; border-radius: var(--maz-radius-lg);
      width: 100%; max-width: 420px; box-shadow: var(--maz-shadow-lg);
      overflow: hidden;
    }
    .dialog-head {
      padding: 20px 24px 12px; display: flex; align-items: center; gap: 12px;
      font-size: 15px; font-weight: 800; color: var(--maz-firouzeh-900);
    }
    .dialog-icon { font-size: 28px; }
    .dialog-body { padding: 0 24px 20px; font-size: 13px; color: var(--maz-gray-600); line-height: 1.7; }
    .dialog-foot {
      padding: 16px 24px; border-top: 1px solid var(--maz-border);
      display: flex; gap: 10px; justify-content: flex-end;
    }
  `],
  template: `
    @if (visible) {
      <div class="overlay" (click)="onOverlay($event)">
        <div class="dialog">
          <div class="dialog-head">
            @if (icon) { <span class="dialog-icon">{{ icon }}</span> }
            <span>{{ title }}</span>
          </div>
          <div class="dialog-body">{{ message }}</div>
          <div class="dialog-foot">
            <button class="maz-btn maz-btn--ghost" (click)="cancel.emit()">انصراف</button>
            <button class="maz-btn maz-btn--danger" (click)="confirm.emit()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() message = '';
  @Input() icon = '';
  @Input() confirmLabel = 'تأیید';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.cancel.emit();
  }
}
