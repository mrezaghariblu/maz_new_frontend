// src/app/features/centers/centers-list/centers-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { CentersApi }   from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { ExcelDownloadService } from '../../../core/services/excel-download.service';
import { AuthService }  from '../../../core/auth/auth.service';
import { SmartFilterComponent, FilterField } from '../../../shared/components/smart-filter/smart-filter.component';
import { ExcelExportDialogComponent, AvailableColumn } from '../../../shared/components/excel-export-dialog/excel-export-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { FilterCondition, SmartFilterRequest, ExcelExportRequest, Center, PagedResult, CENTER_TYPE_LABEL } from '../../../core/models';

const FILTER_FIELDS: FilterField[] = [
  { key: 'name',     label: 'نام مرکز',  type: 'string'  },
  { key: 'code',     label: 'کد مرکز',   type: 'string'  },
  { key: 'city',     label: 'شهر',       type: 'string'  },
  { key: 'province', label: 'استان',     type: 'string'  },
  { key: 'isActive', label: 'فعال',      type: 'boolean' },
  { key: 'type',     label: 'نوع',       type: 'enum',
    enumOptions: [
      { value: 'PRIMARY',    label: 'دبستان'      },
      { value: 'MIDDLE',     label: 'متوسطه اول'  },
      { value: 'HIGH',       label: 'دبیرستان'    },
      { value: 'VOCATIONAL', label: 'هنرستان'     },
    ],
  },
];

const EXCEL_COLS: AvailableColumn[] = [
  { field: 'name',          header: 'نام مرکز',    width: 30 },
  { field: 'code',          header: 'کد مرکز',     width: 12 },
  { field: 'typeLabel',     header: 'نوع',          width: 14 },
  { field: 'province',      header: 'استان',        width: 14 },
  { field: 'city',          header: 'شهر',          width: 12 },
  { field: 'phone',         header: 'تلفن',         width: 14 },
  { field: 'staffCount',    header: 'پرسنل',        width: 8  },
  { field: 'studentCount',  header: 'دانش‌آموز',    width: 10 },
  { field: 'currentStatus', header: 'وضعیت',        width: 12 },
  { field: 'isActiveLabel', header: 'فعال',         width: 8  },
];

@Component({
  selector: 'maz-centers-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    SmartFilterComponent, ExcelExportDialogComponent,
    ConfirmDialogComponent, StatusBadgeComponent,
  ],
  styles: [`
    .toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
    .action-btns { display: flex; gap: 4px; }
    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
    .type-badge { display: inline-flex; align-items: center; gap: 4px; }
  `],
  template: `
    <div class="maz-page-header">
      <div>
        <div class="maz-page-header__title">مراکز آموزشی</div>
        <div class="maz-page-header__sub">{{ result()?.total ?? 0 }} مرکز</div>
      </div>
      @if (auth.isSuperuser()) {
        <a class="maz-btn maz-btn--primary" routerLink="/centers/new">+ افزودن مرکز</a>
      }
    </div>

    <maz-smart-filter [fields]="filterFields" (filterChange)="onFilterChange($event)" />

    <div class="toolbar">
      <input class="maz-input" style="width:220px" placeholder="🔍 جستجوی سریع..."
        [(ngModel)]="quickSearch" (input)="load()" />
      <select class="maz-select" style="width:160px" [(ngModel)]="filterType" (change)="load()">
        <option value="">همه انواع</option>
        <option value="PRIMARY">دبستان</option>
        <option value="MIDDLE">متوسطه اول</option>
        <option value="HIGH">دبیرستان</option>
        <option value="VOCATIONAL">هنرستان</option>
      </select>
      <button class="maz-btn maz-btn--gold maz-btn--sm" style="margin-right:auto" (click)="showExcel = true">
        ⬇ Excel
      </button>
    </div>

    <div class="maz-card" style="padding:0;overflow:hidden">
      @if (loading()) {
        <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
      } @else {
        <div class="maz-table-wrap">
          <table class="maz-table">
            <thead>
              <tr>
                <th>#</th>
                <th>نام مرکز</th>
                <th>کد</th>
                <th>نوع</th>
                <th>استان / شهر</th>
                <th style="text-align:center">پرسنل</th>
                <th style="text-align:center">دانش‌آموز</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              @for (c of centers(); track c.id; let i = $index) {
                <tr>
                  <td class="maz-text-muted">{{ rowNum(i) }}</td>
                  <td><strong>{{ c.name }}</strong></td>
                  <td class="maz-text-muted maz-text-sm">{{ c.code }}</td>
                  <td>
                    <span class="maz-badge maz-badge--info">{{ typeLabel(c.type) }}</span>
                  </td>
                  <td>
                    <div style="font-size:12px">
                      <div style="font-weight:600">{{ c.province }}</div>
                      <div style="color:var(--maz-gray-400)">{{ c.city }}</div>
                    </div>
                  </td>
                  <td style="text-align:center;font-weight:700;color:var(--maz-firouzeh-700)">
                    {{ c._count?.userAssignments ?? 0 }}
                  </td>
                  <td style="text-align:center;font-weight:700;color:var(--maz-firouzeh-700)">
                    {{ c._count?.studentEnrollments ?? 0 }}
                  </td>
                  <td>
                    <maz-status-badge
                      [label]="c.isActive ? 'فعال' : 'غیرفعال'"
                      [variant]="c.isActive ? 'active' : 'inactive'"
                    />
                  </td>
                  <td>
                    <div class="action-btns">
                      <a class="maz-btn maz-btn--outline maz-btn--sm"
                        [routerLink]="['/centers', c.id]">مشاهده</a>
                      @if (auth.isSuperuser()) {
                        <a class="maz-btn maz-btn--ghost maz-btn--sm"
                          [routerLink]="['/centers', c.id, 'edit']">ویرایش</a>
                        @if (c.isActive) {
                          <button class="maz-btn maz-btn--danger maz-btn--sm"
                            (click)="centerToDeactivate.set(c)">غیرفعال</button>
                        }
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (!centers().length) {
                <tr class="maz-table--empty">
                  <td [colSpan]="9">هیچ مرکزی یافت نشد</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span class="maz-text-muted">مجموع: {{ result()?.total ?? 0 }}</span>
          <div class="maz-pagination">
            <button class="maz-pagination__btn" [disabled]="page() === 1" (click)="goPage(page()-1)">‹</button>
            <span class="maz-pagination__info">{{ page() }} / {{ result()?.pageCount ?? 1 }}</span>
            <button class="maz-pagination__btn" [disabled]="page() === result()?.pageCount" (click)="goPage(page()+1)">›</button>
          </div>
        </div>
      }
    </div>

    <maz-excel-export-dialog
      [visible]="showExcel"
      [availableColumns]="excelCols"
      (export)="onExport($event)"
      (closed)="showExcel = false"
    />

    <maz-confirm-dialog
      [visible]="!!centerToDeactivate()"
      title="غیرفعال کردن مرکز"
      [message]="'آیا می‌خواهید مرکز «' + (centerToDeactivate()?.name ?? '') + '» را غیرفعال کنید؟'"
      icon="🏫"
      confirmLabel="غیرفعال کن"
      (confirm)="doDeactivate()"
      (cancel)="centerToDeactivate.set(null)"
    />
  `,
})
export class CentersListComponent implements OnInit {
  private api      = inject(CentersApi);
  private appState = inject(AppStateService);
  private excel    = inject(ExcelDownloadService);
  readonly auth    = inject(AuthService);

  readonly filterFields = FILTER_FIELDS;
  readonly excelCols    = EXCEL_COLS;

  loading  = signal(true);
  result   = signal<PagedResult<Center> | null>(null);
  centers  = computed(() => this.result()?.data ?? []);
  page     = signal(1);
  pageSize = 20;

  activeFilters:      FilterCondition[] = [];
  quickSearch         = '';
  filterType          = '';
  showExcel           = false;
  centerToDeactivate  = signal<Center | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list(this.buildRequest()).subscribe({
      next:  r  => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(f: FilterCondition[]) { this.activeFilters = f; this.page.set(1); this.load(); }
  goPage(p: number) { this.page.set(p); this.load(); }
  rowNum(i: number) { return (this.page() - 1) * this.pageSize + i + 1; }

  doDeactivate() {
    const c = this.centerToDeactivate();
    if (!c) return;
    this.api.deactivate(c.id).subscribe({
      next:  () => { this.appState.toast('مرکز غیرفعال شد', 'success'); this.centerToDeactivate.set(null); this.load(); },
      error: () => this.appState.toast('خطا در غیرفعال کردن', 'error'),
    });
  }

  onExport(e: { columns: any[]; sheetName: string; filename: string }) {
    const req: ExcelExportRequest = { ...this.buildRequest(), page: 1, pageSize: 10000, columns: e.columns, sheetName: e.sheetName, filename: e.filename };
    this.excel.download(this.api.exportExcel(req), e.filename);
  }

  private buildRequest(): SmartFilterRequest {
    const filters = [...this.activeFilters];
    let order = filters.length + 1;
    if (this.quickSearch.trim())
      filters.push({ field: 'name', fieldType: 'string', operator: 'contains', value: this.quickSearch.trim(), order: order++ });
    if (this.filterType)
      filters.push({ field: 'type', fieldType: 'enum', operator: 'equals', value: this.filterType, order: order++ });
    return { filters, sort: { field: 'name', direction: 'asc' }, page: this.page(), pageSize: this.pageSize };
  }

  typeLabel(t: string) { return CENTER_TYPE_LABEL[t as keyof typeof CENTER_TYPE_LABEL] ?? t; }
}