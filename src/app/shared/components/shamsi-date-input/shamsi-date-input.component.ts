import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SHAMSI_MONTHS, SHAMSI_DAYS, SHAMSI_YEARS_RANGE } from '../../utils/shamsi.util';

export interface ShamsiDate {
  year:  number | null;
  month: number | null;
  day:   number | null;
}

@Component({
  selector: 'maz-shamsi-date',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .shamsi-wrap { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .shamsi-label { font-size: 11px; color: var(--maz-gray-500); margin-bottom: 2px; }
    select { padding: 7px 8px; border: 1.5px solid var(--maz-border); border-radius: var(--maz-radius-sm);
      font-family: var(--maz-font); font-size: 13px; color: var(--maz-gray-700); outline: none; background:#fff;
      &:focus { border-color: var(--maz-firouzeh-400); } }
    .yr  { width: 90px; }
    .mon { width: 100px; }
    .dy  { width: 64px; }
  `],
  template: `
    <div class="shamsi-wrap">
      <div>
        <div class="shamsi-label">سال</div>
        <select class="yr" [ngModel]="value.year" (ngModelChange)="emit('year', $event)">
          <option [value]="null">سال</option>
          @for (y of years; track y) { <option [value]="y">{{ y }}</option> }
        </select>
      </div>
      <div>
        <div class="shamsi-label">ماه</div>
        <select class="mon" [ngModel]="value.month" (ngModelChange)="emit('month', $event)">
          <option [value]="null">ماه</option>
          @for (m of months; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
        </select>
      </div>
      @if (showDay) {
        <div>
          <div class="shamsi-label">روز</div>
          <select class="dy" [ngModel]="value.day" (ngModelChange)="emit('day', $event)">
            <option [value]="null">روز</option>
            @for (d of days; track d) { <option [value]="d">{{ d }}</option> }
          </select>
        </div>
      }
    </div>
  `,
})
export class ShamsiDateInputComponent implements OnInit {
  @Input() value: ShamsiDate = { year: null, month: null, day: null };
  @Input() showDay = true;
  @Input() yearFrom = 1320;
  @Input() yearTo   = 1415;
  @Output() valueChange = new EventEmitter<ShamsiDate>();

  months = SHAMSI_MONTHS;
  days   = SHAMSI_DAYS;
  years: number[] = [];

  ngOnInit() {
    this.years = SHAMSI_YEARS_RANGE(this.yearFrom, this.yearTo);
  }

  emit(field: 'year' | 'month' | 'day', val: any) {
    const updated = { ...this.value, [field]: val ? +val : null };
    this.valueChange.emit(updated);
  }
}
