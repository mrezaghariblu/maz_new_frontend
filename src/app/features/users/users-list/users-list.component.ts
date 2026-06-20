// src/app/features/users/users-list/users-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { UsersApi }     from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { ExcelDownloadService } from '../../../core/services/excel-download.service';
import { AuthService }  from '../../../core/auth/auth.service';
import { SmartFilterComponent, FilterField } from '../../../shared/components/smart-filter/smart-filter.component';
import { ExcelExportDialogComponent, AvailableColumn } from '../../../shared/components/excel-export-dialog/excel-export-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent, personnelStatusVariant } from '../../../shared/components/status-badge/status-badge.component';
import { FilterCondition, SmartFilterRequest, ExcelExportRequest, User, PagedResult, USER_TYPE_LABEL, GENDER_LABEL } from '../../../core/models';

const FILTER_FIELDS: FilterField[] = [
  { key: 'firstName',    label: 'نام',              type: 'string'  },
  { key: 'lastName',     label: 'نام خانوادگی',     type: 'string'  },
  { key: 'nationalCode', label: 'کد ملی',            type: 'string'  },
  { key: 'phone',        label: 'تلفن',              type: 'string'  },
  { key: 'isActive',     label: 'وضعیت فعال',        type: 'boolean' },
  { key: 'canLogin',     label: 'دسترسی لاگین',      type: 'boolean' },
  { key: 'userType',     label: 'نقش',               type: 'enum',
    enumOptions: [
      { value: 'CENTER_MANAGER', label: 'مدیر مرکز' },
      { value: 'TEACHER',        label: 'معلم'       },
      { value: 'STAFF',          label: 'کارمند'     },
    ],
  },
  { key: 'gender',       label: 'جنسیت',             type: 'enum',
    enumOptions: [
      { value: 'MALE', label: 'مرد' }, { value: 'FEMALE', label: 'زن' },
    ],
  },
  { key: 'createdAt',    label: 'تاریخ ثبت',         type: 'date'   },
];

const EXCEL_COLS: AvailableColumn[] = [
  { field: 'fullName',      header: 'نام و نام خانوادگی', width: 25 },
  { field: 'nationalCode',  header: 'کد ملی',             width: 14 },
  { field: 'genderLabel',   header: 'جنسیت',              width: 8  },
  { field: 'userTypeLabel', header: 'نقش',                width: 14 },
  { field: 'phone',         header: 'تلفن',               width: 14 },
  { field: 'centerName',    header: 'مرکز',               width: 30 },
  { field: 'city',          header: 'شهر',                width: 12 },
  { field: 'currentStatus', header: 'وضعیت پرسنلی',      width: 18 },
  { field: 'isActiveLabel', header: 'فعال',               width: 8  },
  { field: 'createdAt',     header: 'تاریخ ثبت',          width: 16, format: 'date' },
];

@Component({
  selector: 'maz-users-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    SmartFilterComponent, ExcelExportDialogComponent,
    ConfirmDialogComponent, StatusBadgeComponent,
  ],
  styles: [`
    .toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
    .toolbar-right { display: flex; gap: 8px; align-items: center; flex: 1; flex-wrap: wrap; }
    .toolbar-left  { display: flex; gap: 8px; }
    .user-name-cell { display: flex; flex-direction: column;
      .name { font-weight: 700; color: var(--maz-gray-800); }
      .nc   { font-size: 11px; color: var(--maz-gray-400); margin-top: 1px; }
    }
    .center-cell { font-size: 12px;
      .c-name { font-weight: 600; color: var(--maz-gray-700); }
      .c-city { color: var(--maz-gray-400); }
    }
    .action-btns { display: flex; gap: 4px; }
    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
    .page-size-sel { padding: 5px 10px; border-radius: var(--maz-radius-sm); border: 1.5px solid var(--maz-border); font-family: var(--maz-font); font-size: 12px; outline: none; }
  `],
  template: `
    <div class="maz-page-header">
      <div>
        <div class="maz-page-header__title">مدیریت پرسنل</div>
        <div class="maz-page-header__sub">{{ result()?.total ?? 0 }} نفر</div>
      </div>
      @if (auth.isSuperuser()) {
        <a class="maz-btn maz-btn--primary" routerLink="/users/new">+ افزودن پرسنل</a>
      }
    </div>

    <maz-smart-filter [fields]="filterFields" (filterChange)="onFilterChange($event)" />

    <div class="toolbar">
      <div class="toolbar-right">
        <input class="maz-input" style="width:220px" placeholder="🔍 جستجوی سریع..."
          [(ngModel)]="quickSearch" (input)="onQuickSearch()" />
        <select class="maz-select" style="width:160px" [(ngModel)]="filterUserType" (change)="load()">
          <option value="">همه نقش‌ها</option>
          <option value="CENTER_MANAGER">مدیر مرکز</option>
          <option value="TEACHER">معلم</option>
          <option value="STAFF">کارمند</option>
        </select>
      </div>
      <div class="toolbar-left">
        <button class="maz-btn maz-btn--gold maz-btn--sm" (click)="showExcel = true">⬇ Excel</button>
        <select class="page-size-sel" [(ngModel)]="pageSize" (change)="load()">
          <option [value]="10">۱۰ ردیف</option>
          <option [value]="20">۲۰ ردیف</option>
          <option [value]="50">۵۰ ردیف</option>
        </select>
      </div>
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
                <th>نام و نام خانوادگی</th>
                <th>نقش</th>
                <th>جنسیت</th>
                <th>مرکز</th>
                <th>وضعیت پرسنلی</th>
                <th>تلفن</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id; let i = $index) {
                <tr>
                  <td class="maz-text-muted">{{ rowNum(i) }}</td>
                  <td>
                    <div class="user-name-cell">
                      <span class="name">{{ user.firstName }} {{ user.lastName }}</span>
                      <span class="nc">{{ user.nationalCode }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="maz-badge maz-badge--info">{{ userTypeLabel(user.userType) }}</span>
                  </td>
                  <td>{{ genderLabel(user.gender) }}</td>
                  <td>
                    @if (user.centerAssignments?.length) {
                      <div class="center-cell">
                        <div class="c-name">{{ user.centerAssignments![0].center?.name }}</div>
                        <div class="c-city">{{ user.centerAssignments![0].center?.city }}</div>
                      </div>
                    } @else {
                      <span class="maz-text-muted">—</span>
                    }
                  </td>
                  <td>
                    @if (user.personnelStatusHistory?.length) {
                      <maz-status-badge
                        [label]="user.personnelStatusHistory![0].statusType?.label ?? ''"
                        [variant]="statusVariant(user.personnelStatusHistory![0].statusType?.code ?? '')"
                      />
                    } @else {
                      <span class="maz-text-muted">—</span>
                    }
                  </td>
                  <td><span class="maz-text-sm">{{ user.phone ?? '—' }}</span></td>
                  <td>
                    <maz-status-badge
                      [label]="user.isActive ? 'فعال' : 'غیرفعال'"
                      [variant]="user.isActive ? 'active' : 'inactive'"
                    />
                  </td>
                  <td>
                    <div class="action-btns">
                      <a class="maz-btn maz-btn--outline maz-btn--sm"
                        [routerLink]="['/users', user.id]">مشاهده</a>
                      @if (auth.isSuperuser()) {
                        <a class="maz-btn maz-btn--ghost maz-btn--sm"
                          [routerLink]="['/users', user.id, 'edit']">ویرایش</a>
                      }
                      @if (auth.isSuperuser() && user.isActive) {
                        <button class="maz-btn maz-btn--danger maz-btn--sm"
                          (click)="confirmDeactivate(user)">غیرفعال</button>
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (!users().length) {
                <tr class="maz-table--empty">
                  <td [colSpan]="9">هیچ پرسنلی یافت نشد</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span class="maz-text-muted">
            {{ rowNum(0) }}–{{ rowNum(users().length - 1) }} از {{ result()?.total ?? 0 }}
          </span>
          <div class="maz-pagination">
            <button class="maz-pagination__btn" [disabled]="page() === 1" (click)="goPage(1)">«</button>
            <button class="maz-pagination__btn" [disabled]="page() === 1" (click)="goPage(page() - 1)">‹</button>
            @for (p of pageNumbers(); track p) {
              <button class="maz-pagination__btn"
                [class.maz-pagination__btn--active]="p === page()"
                (click)="goPage(p)">{{ p }}</button>
            }
            <button class="maz-pagination__btn" [disabled]="page() === pageCount()" (click)="goPage(page() + 1)">›</button>
            <button class="maz-pagination__btn" [disabled]="page() === pageCount()" (click)="goPage(pageCount())">»</button>
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
      [visible]="!!userToDeactivate()"
      title="غیرفعال کردن پرسنل"
      [message]="'آیا می‌خواهید ' + (userToDeactivate()?.firstName ?? '') + ' ' + (userToDeactivate()?.lastName ?? '') + ' را غیرفعال کنید؟'"
      icon="⚠️"
      confirmLabel="غیرفعال کن"
      (confirm)="doDeactivate()"
      (cancel)="userToDeactivate.set(null)"
    />
  `,
})
export class UsersListComponent implements OnInit {
  private api      = inject(UsersApi);
  private appState = inject(AppStateService);
  private excel    = inject(ExcelDownloadService);
  readonly auth    = inject(AuthService);

  readonly filterFields = FILTER_FIELDS;
  readonly excelCols    = EXCEL_COLS;

  loading  = signal(true);
  result   = signal<PagedResult<User> | null>(null);
  users    = computed(() => this.result()?.data ?? []);
  page     = signal(1);
  pageSize = 20;
  pageCount   = computed(() => this.result()?.pageCount ?? 1);
  pageNumbers = computed(() => {
    const c = this.pageCount(); const p = this.page();
    const start = Math.max(1, p - 2); const end = Math.min(c, p + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  activeFilters:   FilterCondition[] = [];
  quickSearch      = '';
  filterUserType   = '';
  showExcel        = false;
  userToDeactivate = signal<User | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list(this.buildRequest()).subscribe({
      next:  r  => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(filters: FilterCondition[]) { this.activeFilters = filters; this.page.set(1); this.load(); }
  onQuickSearch() { this.page.set(1); this.load(); }
  goPage(p: number) { if (p < 1 || p > this.pageCount()) return; this.page.set(p); this.load(); }
  rowNum(i: number) { return (this.page() - 1) * this.pageSize + i + 1; }

  confirmDeactivate(u: User) { this.userToDeactivate.set(u); }
  doDeactivate() {
    const u = this.userToDeactivate();
    if (!u) return;
    this.api.deactivate(u.id).subscribe({
      next:  () => { this.appState.toast('پرسنل غیرفعال شد', 'success'); this.userToDeactivate.set(null); this.load(); },
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
      filters.push({ field: 'lastName', fieldType: 'string', operator: 'contains', value: this.quickSearch.trim(), order: order++ });
    if (this.filterUserType)
      filters.push({ field: 'userType', fieldType: 'enum', operator: 'equals', value: this.filterUserType, order: order++ });
    return { filters, sort: { field: 'lastName', direction: 'asc' }, page: this.page(), pageSize: this.pageSize };
  }

  userTypeLabel(t: string) { return USER_TYPE_LABEL[t as keyof typeof USER_TYPE_LABEL] ?? t; }
  genderLabel(g: string)   { return GENDER_LABEL[g as keyof typeof GENDER_LABEL] ?? g; }
  statusVariant = personnelStatusVariant;
}