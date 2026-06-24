// src/app/shared/components/smart-filter/smart-filter.component.ts
import {
  Component, Input, Output, EventEmitter, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { FilterCondition, FilterFieldType, SortConfig } from '../../../core/models/index';

export interface FilterField {
  key:        string;
  label:      string;
  type:       FilterFieldType;
  enumOptions?: { value: string; label: string }[];
}

interface ActiveFilter extends FilterCondition {
  _id:        number;
  fieldLabel: string;
}

const STRING_OPS  = [
  { value: 'contains',      label: 'شامل' },
  { value: 'not_contains',  label: 'شامل نمی‌شود' },
  { value: 'equals',        label: 'برابر با' },
  { value: 'not_equals',    label: 'نابرابر با' },
  { value: 'starts_with',   label: 'شروع با' },
  { value: 'ends_with',     label: 'پایان با' },
  { value: 'is_empty',      label: 'خالی است' },
  { value: 'is_not_empty',  label: 'خالی نیست' },
];

const NUMBER_OPS = [
  { value: 'equals',           label: '= برابر' },
  { value: 'not_equals',       label: '≠ نابرابر' },
  { value: 'greater_than',     label: '> بزرگتر' },
  { value: 'less_than',        label: '< کوچکتر' },
  { value: 'greater_or_equal', label: '≥ بزرگتر مساوی' },
  { value: 'less_or_equal',    label: '≤ کوچکتر مساوی' },
  { value: 'between',          label: 'بین دو عدد' },
  { value: 'not_between',      label: 'خارج از بازه' },
  { value: 'is_null',          label: 'بدون مقدار' },
  { value: 'is_not_null',      label: 'دارای مقدار' },
];

const DATE_OPS = [
  { value: 'equals',        label: 'برابر با' },
  { value: 'before',        label: 'قبل از' },
  { value: 'after',         label: 'بعد از' },
  { value: 'between',       label: 'بین دو تاریخ' },
  { value: 'this_month',    label: 'این ماه' },
  { value: 'this_year',     label: 'این سال' },
  { value: 'is_null',       label: 'بدون تاریخ' },
  { value: 'is_not_null',   label: 'دارای تاریخ' },
];

const BOOL_OPS = [
  { value: 'is_true',  label: 'بله / فعال' },
  { value: 'is_false', label: 'خیر / غیرفعال' },
];

@Component({
  selector: 'maz-smart-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .sf-panel {
      background: var(--maz-card-bg);
      border: 1px solid var(--maz-border);
      border-radius: var(--maz-radius-lg);
      padding: 16px 20px;
      margin-bottom: 16px;
    }

    .sf-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
      .sf-title { font-size: 13px; font-weight: 700; color: var(--maz-firouzeh-800); }
    }

    .sf-row {
      display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap;
      margin-bottom: 8px;

      select, input {
        padding: 7px 10px;
        border: 1.5px solid var(--maz-border);
        border-radius: var(--maz-radius-sm);
        font-family: var(--maz-font); font-size: 12px; color: var(--maz-gray-700);
        outline: none; background: #fff;
        &:focus { border-color: var(--maz-firouzeh-400); }
      }

      .sf-field-sel  { width: 150px; }
      .sf-op-sel     { width: 160px; }
      .sf-val-input  { width: 130px; }
      .sf-val-to     { width: 110px; }
    }

    .sf-chips {
      display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
    }

    .sf-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px;
      background: var(--maz-firouzeh-50); border: 1px solid var(--maz-firouzeh-200);
      border-radius: 20px; font-size: 11.5px; color: var(--maz-firouzeh-800); font-weight: 600;

      .sf-chip-order {
        width: 16px; height: 16px; border-radius: 50%;
        background: var(--maz-firouzeh-500); color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 800; flex-shrink: 0;
      }

      .sf-chip-del {
        cursor: pointer; color: var(--maz-firouzeh-400);
        font-size: 14px; line-height: 1;
        &:hover { color: var(--maz-danger); }
      }
    }

    .sf-actions {
      display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
      padding-top: 10px; border-top: 1px solid var(--maz-gray-100);
    }

    .sf-count {
      font-size: 11px; color: var(--maz-gray-400);
      margin-right: auto;
    }
  `],
  template: `
    <div class="sf-panel">
      <div class="sf-header">
        <span class="sf-title">🔍 فیلتر هوشمند</span>
        <span class="maz-text-muted">فیلترها به ترتیب شماره اعمال می‌شوند</span>
      </div>

      <!-- فیلترهای فعال -->
      @if (activeFilters().length) {
        <div class="sf-chips">
          @for (f of activeFilters(); track f._id) {
            <div class="sf-chip">
              <span class="sf-chip-order">{{ f.order }}</span>
              <span>{{ f.fieldLabel }}</span>
              <span style="color:var(--maz-gray-400)">{{ opLabel(f) }}</span>
              @if (f.value !== undefined && f.value !== null && !isNoValueOp(f.operator)) {
                <strong>{{ f.value }}</strong>
              }
              @if (f.valueTo) { <span>تا</span> <strong>{{ f.valueTo }}</strong> }
              <span class="sf-chip-del" (click)="removeFilter(f._id)">×</span>
            </div>
          }
        </div>
      }

      <!-- افزودن فیلتر جدید -->
      <div class="sf-row">
        <select class="sf-field-sel"
          [value]="newField()"
          (change)="onFieldChange($any($event.target).value)">
          <option value="">انتخاب فیلد...</option>
          @for (f of fields; track f.key) {
            <option [value]="f.key">{{ f.label }}</option>
          }
        </select>

        @if (newField()) {
          <select class="sf-op-sel"
            [value]="newOp()"
            (change)="onOpChange($any($event.target).value)">
            @for (op of currentOps(); track op.value) {
              <option [value]="op.value">{{ op.label }}</option>
            }
          </select>

          @if (needsValue()) {
            @if (currentFieldType() === 'boolean' || isNoValueOp(newOp())) {
              <!-- بدون input -->
            } @else if (currentFieldType() === 'enum') {
              <select class="sf-val-input" [(ngModel)]="newValue">
                @for (opt of currentEnumOpts(); track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            } @else {
              <input
                class="sf-val-input"
                [type]="currentFieldType() === 'number' ? 'number' : currentFieldType() === 'date' ? 'date' : 'text'"
                placeholder="مقدار"
                [(ngModel)]="newValue"
              />
              @if (newOp() === 'between' || newOp() === 'not_between') {
                <span style="font-size:12px;color:var(--maz-gray-400)">تا</span>
                <input class="sf-val-to" [type]="currentFieldType() === 'number' ? 'number' : 'date'" placeholder="مقدار دوم" [(ngModel)]="newValueTo" />
              }
            }
          }

          <button class="maz-btn maz-btn--primary maz-btn--sm" (click)="addFilter()">+ افزودن</button>
        }
      </div>

      <!-- دکمه‌های اعمال -->
      <div class="sf-actions">
        <button class="maz-btn maz-btn--primary" (click)="apply()">اعمال فیلترها</button>
        @if (activeFilters().length) {
          <button class="maz-btn maz-btn--ghost" (click)="clearAll()">پاک کردن همه</button>
        }
        <span class="sf-count">{{ activeFilters().length }} فیلتر فعال</span>
      </div>
    </div>
  `,
})
export class SmartFilterComponent implements OnInit {
  @Input() fields: FilterField[] = [];
  @Output() filterChange = new EventEmitter<FilterCondition[]>();

  private _filters = signal<ActiveFilter[]>([]);
  readonly activeFilters = this._filters.asReadonly();

  // ─── تبدیل به signal تا computed‌ها واکنش نشان بدن ────────────
  readonly newField = signal('');
  readonly newOp    = signal('');
  newValue:   any = '';
  newValueTo: any = '';
  private _nextId = 1;

  readonly currentFieldDef  = computed(() => this.fields.find(f => f.key === this.newField()));
  readonly currentFieldType = computed((): FilterFieldType => this.currentFieldDef()?.type ?? 'string');
  readonly currentEnumOpts  = computed(() => this.currentFieldDef()?.enumOptions ?? []);

  readonly currentOps = computed(() => {
    switch (this.currentFieldType()) {
      case 'number':  return NUMBER_OPS;
      case 'date':    return DATE_OPS;
      case 'boolean': return BOOL_OPS;
      case 'enum':    return [{ value: 'equals', label: 'برابر با' }, { value: 'not_equals', label: 'نابرابر با' }];
      default:        return STRING_OPS;
    }
  });

  readonly needsValue = computed(() => !this.isNoValueOp(this.newOp()));

  ngOnInit() { this.newField.set(''); }

  onFieldChange(val: string) {
    this.newField.set(val);
    // بلافاصله بعد از set، currentOps() به‌روزه چون signal هست
    const ops = this.currentOps();
    this.newOp.set(ops[0]?.value ?? '');
    this.newValue   = '';
    this.newValueTo = '';
  }

  onOpChange(val: string) { this.newOp.set(val); }

  addFilter() {
    const field = this.newField();
    const op    = this.newOp();
    if (!field || !op) return;
    const fieldDef = this.currentFieldDef();
    if (!fieldDef) return;

    const filter: ActiveFilter = {
      _id:        this._nextId++,
      field,
      fieldLabel: fieldDef.label,
      fieldType:  fieldDef.type,
      operator:   op,
      value:      this.isNoValueOp(op) ? null : this.newValue,
      valueTo:    (op === 'between' || op === 'not_between') ? this.newValueTo : undefined,
      order:      this._filters().length + 1,
    };

    this._filters.update(f => [...f, filter]);
    this.newValue   = '';
    this.newValueTo = '';
  }

  removeFilter(id: number) {
    this._filters.update(f => {
      const updated = f.filter(x => x._id !== id);
      return updated.map((x, i) => ({ ...x, order: i + 1 }));
    });
  }

  clearAll() {
    this._filters.set([]);
    this.filterChange.emit([]);
  }

  apply() {
    const conditions: FilterCondition[] = this._filters().map(f => ({
      field:     f.field,
      fieldType: f.fieldType,
      operator:  f.operator,
      value:     f.value,
      valueTo:   f.valueTo,
      order:     f.order,
    }));
    this.filterChange.emit(conditions);
  }

  isNoValueOp(op: string): boolean {
    return ['is_empty','is_not_empty','is_null','is_not_null','this_year','this_month','is_true','is_false'].includes(op);
  }

  opLabel(f: ActiveFilter): string {
    const ops = [...STRING_OPS, ...NUMBER_OPS, ...DATE_OPS, ...BOOL_OPS];
    return ops.find(o => o.value === f.operator)?.label ?? f.operator;
  }
}