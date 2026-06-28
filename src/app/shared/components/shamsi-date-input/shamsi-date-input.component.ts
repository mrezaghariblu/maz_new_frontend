// src/app/shared/components/shamsi-date-input/shamsi-date-input.component.ts
import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SHAMSI_MONTHS, shamsiYearRange, shamsiDaysInMonth, todayShamsi } from '../../utils/shamsi.util';

export interface ShamsiDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

@Component({
  selector: 'maz-shamsi-date-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .shamsi-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1.5fr;
      gap: 8px;
    }
    .maz-select { width: 100%; }
    label.field-sublabel {
      display: block;
      font-size: 11px;
      color: var(--maz-gray-500);
      margin-bottom: 4px;
    }
  `],
  template: `
    <div class="shamsi-row">
      <div>
        <label class="field-sublabel">سال</label>
        <select class="maz-select" [ngModel]="value().year" (ngModelChange)="onYearChange($event)">
          <option [value]="null">—</option>
          @for (y of years; track y) {
            <option [value]="y">{{ y }}</option>
          }
        </select>
      </div>
      <div>
        <label class="field-sublabel">ماه</label>
        <select class="maz-select" [ngModel]="value().month" (ngModelChange)="onMonthChange($event)">
          <option [value]="null">—</option>
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
      </div>
      <div>
        <label class="field-sublabel">روز</label>
        <select class="maz-select" [ngModel]="value().day" (ngModelChange)="onDayChange($event)">
          <option [value]="null">—</option>
          @for (d of days(); track d) {
            <option [value]="d">{{ d }}</option>
          }
        </select>
      </div>
    </div>
  `,
})
export class ShamsiDateInputComponent implements OnChanges {
  @Input() initialValue?: ShamsiDate | null;
  @Output() dateChange = new EventEmitter<ShamsiDate>();

  readonly months = SHAMSI_MONTHS;
  readonly years  = (() => {
    const [cy] = todayShamsi();
    return shamsiYearRange(cy - 100, cy + 5);
  })();

  value = signal<ShamsiDate>({ year: null, month: null, day: null });

  days = computed(() => {
    const { year, month } = this.value();
    if (!year || !month) return Array.from({ length: 31 }, (_, i) => i + 1);
    const count = shamsiDaysInMonth(year, month);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue'] && this.initialValue) {
      this.value.set({
        year:  this.initialValue.year  ?? null,
        month: this.initialValue.month ?? null,
        day:   this.initialValue.day   ?? null,
      });
    }
  }

  onYearChange(y: number | null) {
    this.value.update(v => ({ ...v, year: y ? Number(y) : null }));
    this.emit();
  }
  onMonthChange(m: number | null) {
    const newMonth = m ? Number(m) : null;
    const maxDay = newMonth && this.value().year
      ? shamsiDaysInMonth(this.value().year!, newMonth)
      : 31;
    const day = this.value().day && this.value().day! > maxDay ? null : this.value().day;
    this.value.update(v => ({ ...v, month: newMonth, day }));
    this.emit();
  }
  onDayChange(d: number | null) {
    this.value.update(v => ({ ...v, day: d ? Number(d) : null }));
    this.emit();
  }

  private emit() {
    this.dateChange.emit(this.value());
  }
}
