import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentsApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { ExcelDownloadService } from '../../../core/services/excel-download.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SmartFilterComponent, FilterField } from '../../../shared/components/smart-filter/smart-filter.component';
import { ExcelExportDialogComponent, AvailableColumn } from '../../../shared/components/excel-export-dialog/excel-export-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { FilterCondition, SmartFilterRequest, ExcelExportRequest, Student, PagedResult, GENDER_LABEL } from '../../../core/models';

const FILTER_FIELDS: FilterField[] = [
  { key: 'firstName',    label: 'نام',          type: 'string'  },
  { key: 'lastName',     label: 'نام خانوادگی', type: 'string'  },
  { key: 'nationalCode', label: 'کد ملی',        type: 'string'  },
  { key: 'parentPhone',  label: 'تلفن والد',    type: 'string'  },
  { key: 'isActive',     label: 'فعال',         type: 'boolean' },
  { key: 'gender',       label: 'جنسیت',        type: 'enum',
    enumOptions: [{ value: 'MALE', label: 'مرد' }, { value: 'FEMALE', label: 'زن' }],
  },
];

const EXCEL_COLS: AvailableColumn[] = [
  { field: 'fullName',     header: 'نام و نام خانوادگی', width: 25 },
  { field: 'nationalCode', header: 'کد ملی',             width: 14 },
  { field: 'genderLabel',  header: 'جنسیت',              width: 8  },
  { field: 'grade',        header: 'پایه',               width: 10 },
  { field: 'centerName',   header: 'مرکز',               width: 30 },
  { field: 'parentPhone',  header: 'تلفن والد',          width: 14 },
  { field: 'isActiveLabel',header: 'فعال',               width: 8  },
];

@Component({
  selector: 'maz-students-list',
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
  `],
  template: `
    <div class="maz-page-header">
      <div>
        <div class="maz-page-header__title">دانش‌آموزان</div>
        <div class="maz-page-header__sub">{{ result()?.total ?? 0 }} نفر</div>
      </div>
      <a class="maz-btn maz-btn--primary" routerLink="/students/new">+ افزودن دانش‌آموز</a>
    </div>

    <maz-smart-filter [fields]="filterFields" (filterChange)="onFilterChange($event)" />

    <div class="toolbar">
      <input class="maz-input" style="width:220px" placeholder="🔍 جستجوی سریع..."
        [(ngModel)]="quickSearch" (input)="load()" />
      <button class="maz-btn maz-btn--gold maz-btn--sm" style="margin-right:auto" (click)="showExcel = true">⬇ Excel</button>
    </div>

    <div class="maz-card" style="padding:0;overflow:hidden">
      @if (loading()) {
        <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
      } @else {
        <div class="maz-table-wrap">
          <table class="maz-table">
            <thead>
              <tr>
                <th>#</th><th>نام</th><th>کد ملی</th><th>جنسیت</th><th>پایه</th><th>مرکز</th><th>وضعیت</th><th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              @for (s of students(); track s.id; let i = $index) {
                <tr>
                  <td class="maz-text-muted">{{ rowNum(i) }}</td>
                  <td><strong>{{ s.firstName }} {{ s.lastName }}</strong></td>
                  <td class="maz-text-muted maz-text-sm">{{ s.nationalCode }}</td>
                  <td>{{ genderLabel(s.gender) }}</td>
                  <td>{{ s.enrollments?.[0]?.grade ?? '—' }}</td>
                  <td>{{ s.enrollments?.[0]?.center?.name ?? '—' }}</td>
                  <td>
                    <maz-status-badge [label]="s.isActive ? 'فعال' : 'غیرفعال'" [variant]="s.isActive ? 'active' : 'inactive'" />
                  </td>
                  <td>
                    <div class="action-btns">
                      <a class="maz-btn maz-btn--outline maz-btn--sm" [routerLink]="['/students', s.id]">مشاهده</a>
                      <a class="maz-btn maz-btn--ghost maz-btn--sm" [routerLink]="['/students', s.id, 'edit']">ویرایش</a>
                      @if (s.isActive) {
                        <button class="maz-btn maz-btn--danger maz-btn--sm" (click)="studentToDeactivate.set(s)">غیرفعال</button>
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (!students().length) {
                <tr class="maz-table--empty"><td [colSpan]="8">هیچ دانش‌آموزی یافت نشد</td></tr>
              }
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span class="maz-text-muted">مجموع: {{ result()?.total ?? 0 }}</span>
          <div class="maz-pagination">
            <button class="maz-pagination__btn" [disabled]="page() === 1" (click)="goPage(page()-1)">‹</button>
            <span class="maz-pagination__info">{{ page() }} / {{ pageCount() }}</span>
            <button class="maz-pagination__btn" [disabled]="page() === pageCount()" (click)="goPage(page()+1)">›</button>
          </div>
        </div>
      }
    </div>

    <maz-excel-export-dialog [visible]="showExcel" [availableColumns]="excelCols" (export)="onExport($event)" (closed)="showExcel = false" />
    <maz-confirm-dialog
      [visible]="!!studentToDeactivate()"
      title="غیرفعال کردن دانش‌آموز"
      [message]="'آیا می‌خواهید ' + (studentToDeactivate()?.firstName ?? '') + ' ' + (studentToDeactivate()?.lastName ?? '') + ' را غیرفعال کنید؟'"
      icon="🎓" confirmLabel="غیرفعال کن"
      (confirm)="doDeactivate()" (cancel)="studentToDeactivate.set(null)"
    />
  `,
})
export class StudentsListComponent implements OnInit {
  private api      = inject(StudentsApi);
  private appState = inject(AppStateService);
  private excel    = inject(ExcelDownloadService);
  readonly auth    = inject(AuthService);

  readonly filterFields = FILTER_FIELDS;
  readonly excelCols    = EXCEL_COLS;

  loading  = signal(true);
  result   = signal<PagedResult<Student> | null>(null);
  students = computed(() => this.result()?.data ?? []);
  page     = signal(1);
  pageSize = 20;
  pageCount = computed(() => this.result()?.pageCount ?? 1);

  activeFilters: FilterCondition[] = [];
  quickSearch = '';
  showExcel = false;
  studentToDeactivate = signal<Student | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list(this.buildRequest()).subscribe({
      next:  r  => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(f: FilterCondition[]) { this.activeFilters = f; this.page.set(1); this.load(); }
  goPage(p: number) { if (p < 1 || p > this.pageCount()) return; this.page.set(p); this.load(); }
  rowNum(i: number) { return (this.page() - 1) * this.pageSize + i + 1; }

  doDeactivate() {
    const s = this.studentToDeactivate();
    if (!s) return;
    this.api.deactivate(s.id).subscribe({
      next:  () => { this.appState.toast('دانش‌آموز غیرفعال شد', 'success'); this.studentToDeactivate.set(null); this.load(); },
      error: () => this.appState.toast('خطا در غیرفعال کردن', 'error'),
    });
  }

  onExport(e: { columns: ExcelExportRequest['columns']; sheetName: string; filename: string }) {
    const req: ExcelExportRequest = { ...this.buildRequest(), page: 1, pageSize: 10000, columns: e.columns, sheetName: e.sheetName, filename: e.filename };
    this.excel.download(this.api.exportExcel(req), e.filename);
  }

  private buildRequest(): SmartFilterRequest {
    const filters = [...this.activeFilters];
    let order = filters.length + 1;
    if (this.quickSearch.trim())
      filters.push({ field: 'lastName', fieldType: 'string', operator: 'contains', value: this.quickSearch.trim(), order: order++ });
    return { filters, sort: { field: 'lastName', direction: 'asc' }, page: this.page(), pageSize: this.pageSize };
  }

  genderLabel(g: string) { return GENDER_LABEL[g as keyof typeof GENDER_LABEL] ?? g; }
}
