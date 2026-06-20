// src/app/shared/components/excel-export-dialog/excel-export-dialog.component.ts
import {
  Component, Input, Output, EventEmitter, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ExcelColumn }  from '../../../core/models';

export interface AvailableColumn {
  field:   string;
  header:  string;
  width?:  number;
  format?: string;
}

@Component({
  selector: 'maz-excel-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: fade-in .15s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .dialog {
      background: #fff; border-radius: var(--maz-radius-lg);
      width: 100%; max-width: 580px; max-height: 85vh;
      display: flex; flex-direction: column;
      box-shadow: var(--maz-shadow-lg);
      animation: slide-up .2s ease;
    }
    @keyframes slide-up { from { transform: translateY(16px); opacity:0; } to { transform: none; opacity:1; } }

    .dialog-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--maz-border);
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
      .title { font-size: 15px; font-weight: 800; color: var(--maz-firouzeh-900); }
      .close-btn {
        width: 32px; height: 32px; border-radius: 50%; border: none;
        background: var(--maz-gray-100); cursor: pointer; font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        &:hover { background: var(--maz-gray-200); }
      }
    }

    .dialog-body { padding: 20px 24px; overflow-y: auto; flex: 1; }

    .section-title {
      font-size: 12px; font-weight: 700; color: var(--maz-gray-500);
      text-transform: uppercase; letter-spacing: .05em;
      margin-bottom: 10px;
    }

    /* ستون‌های انتخاب‌شده — قابل مرتب‌سازی */
    .selected-cols {
      border: 1.5px solid var(--maz-firouzeh-200);
      border-radius: var(--maz-radius-md);
      background: var(--maz-firouzeh-50);
      min-height: 60px;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .selected-col-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 14px;
      border-bottom: 1px solid var(--maz-firouzeh-100);
      background: #fff;
      &:last-child { border-bottom: none; }

      .order-badge {
        width: 22px; height: 22px; border-radius: 50%;
        background: var(--maz-firouzeh-600); color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 800; flex-shrink: 0;
      }
      .col-label { flex: 1; font-size: 13px; font-weight: 600; color: var(--maz-gray-700); }
      .move-btns { display: flex; gap: 2px; }
      .move-btn {
        padding: 2px 6px; border-radius: 4px; border: 1px solid var(--maz-border);
        background: #fff; cursor: pointer; font-size: 11px; color: var(--maz-gray-500);
        &:hover:not([disabled]) { background: var(--maz-firouzeh-50); color: var(--maz-firouzeh-600); }
        &[disabled] { opacity: .35; cursor: not-allowed; }
      }
      .remove-btn {
        padding: 2px 8px; border-radius: 4px; border: 1px solid #fecaca;
        background: #fff5f5; color: var(--maz-danger); cursor: pointer; font-size: 12px;
        &:hover { background: #fee2e2; }
      }
    }

    .empty-cols {
      padding: 20px; text-align: center;
      color: var(--maz-gray-400); font-size: 13px;
    }

    /* ستون‌های موجود */
    .available-cols {
      display: flex; flex-wrap: wrap; gap: 6px;
      margin-bottom: 20px;
    }

    .avail-chip {
      padding: 5px 12px;
      border-radius: 20px;
      border: 1.5px solid var(--maz-border);
      background: #fff; font-size: 12px; font-weight: 600;
      cursor: pointer; color: var(--maz-gray-600);
      transition: all .15s;
      &:hover { border-color: var(--maz-firouzeh-400); color: var(--maz-firouzeh-700); background: var(--maz-firouzeh-50); }
      &.selected { border-color: var(--maz-firouzeh-300); background: var(--maz-firouzeh-50); color: var(--maz-firouzeh-600); opacity: .5; cursor: default; }
    }

    /* تنظیمات Excel */
    .excel-settings {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      padding-top: 16px; border-top: 1px solid var(--maz-border);
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--maz-border);
      display: flex; gap: 10px; justify-content: flex-end;
      flex-shrink: 0;
    }
  `],
  template: `
    @if (visible) {
      <div class="overlay" (click)="onOverlayClick($event)">
        <div class="dialog">
          <div class="dialog-header">
            <span class="title">⬇ خروجی Excel — انتخاب ستون‌ها</span>
            <button class="close-btn" (click)="close()">×</button>
          </div>

          <div class="dialog-body">

            <!-- ستون‌های انتخاب‌شده -->
            <div class="section-title">ستون‌های انتخاب‌شده (به ترتیب)</div>
            <div class="selected-cols">
              @if (selectedCols().length === 0) {
                <div class="empty-cols">هیچ ستونی انتخاب نشده — روی ستون‌های زیر کلیک کنید</div>
              }
              @for (col of selectedCols(); track col.field; let i = $index) {
                <div class="selected-col-item">
                  <div class="order-badge">{{ i + 1 }}</div>
                  <span class="col-label">{{ col.header }}</span>
                  <div class="move-btns">
                    <button class="move-btn" [disabled]="i === 0" (click)="moveUp(i)">▲</button>
                    <button class="move-btn" [disabled]="i === selectedCols().length - 1" (click)="moveDown(i)">▼</button>
                  </div>
                  <button class="remove-btn" (click)="removeCol(col.field)">حذف</button>
                </div>
              }
            </div>

            <!-- ستون‌های موجود -->
            <div class="section-title">ستون‌های موجود</div>
            <div class="available-cols">
              @for (col of availableColumns; track col.field) {
                <span
                  class="avail-chip"
                  [class.selected]="isSelected(col.field)"
                  (click)="addCol(col)"
                >
                  {{ col.header }}
                  @if (isSelected(col.field)) { ✓ }
                </span>
              }
            </div>

            <!-- تنظیمات -->
            <div class="excel-settings">
              <div class="maz-form-group">
                <label class="maz-label">نام Sheet</label>
                <input class="maz-input" [(ngModel)]="sheetName" placeholder="داده‌ها" />
              </div>
              <div class="maz-form-group">
                <label class="maz-label">نام فایل</label>
                <input class="maz-input" [(ngModel)]="filename" placeholder="export" />
              </div>
            </div>

          </div>

          <div class="dialog-footer">
            <button class="maz-btn maz-btn--ghost" (click)="close()">انصراف</button>
            <button
              class="maz-btn maz-btn--gold"
              [disabled]="selectedCols().length === 0"
              (click)="exportNow()"
            >
              ⬇ دانلود Excel ({{ selectedCols().length }} ستون)
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ExcelExportDialogComponent {
  @Input() visible         = false;
  @Input() availableColumns: AvailableColumn[] = [];
  @Output() export  = new EventEmitter<{ columns: ExcelColumn[]; sheetName: string; filename: string }>();
  @Output() closed  = new EventEmitter<void>();

  private _selected = signal<AvailableColumn[]>([]);
  readonly selectedCols = this._selected.asReadonly();

  sheetName = 'داده‌ها';
  filename  = 'export';

  isSelected(field: string) {
    return this._selected().some(c => c.field === field);
  }

  addCol(col: AvailableColumn) {
    if (this.isSelected(col.field)) return;
    this._selected.update(s => [...s, col]);
  }

  removeCol(field: string) {
    this._selected.update(s => s.filter(c => c.field !== field));
  }

  moveUp(i: number) {
    this._selected.update(s => {
      const a = [...s];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  }

  moveDown(i: number) {
    this._selected.update(s => {
      const a = [...s];
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return a;
    });
  }

  exportNow() {
    const columns: ExcelColumn[] = this._selected().map((c, i) => ({
      field:  c.field,
      header: c.header,
      order:  i + 1,
      width:  c.width,
      format: c.format,
    }));
    this.export.emit({ columns, sheetName: this.sheetName, filename: this.filename });
    this.close();
  }

  close() {
    this._selected.set([]);
    this.closed.emit();
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.close();
  }
}