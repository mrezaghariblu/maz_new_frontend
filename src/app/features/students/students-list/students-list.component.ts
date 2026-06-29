import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentsApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { ExcelDownloadService } from '../../../core/services/excel-download.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SmartFilterComponent, FilterField } from '../../../shared/components/smart-filter/smart-filter.component';
import { ExcelExportDialogComponent, AvailableColumn } from '../../../shared/components/excel-export-dialog/excel-export-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { formatShamsi } from '../../../shared/utils/shamsi.util';
import { FilterCondition, SmartFilterRequest, ExcelExportRequest, Student, PagedResult } from '../../../core/models';

const FILTER_FIELDS: FilterField[] = [
  // ─── اطلاعات شخصی ─────────────────────────────
  { key: 'firstName',      label: 'نام',                type: 'string'  },
  { key: 'lastName',       label: 'نام خانوادگی',       type: 'string'  },
  { key: 'nationalCode',   label: 'کد ملی',             type: 'string'  },
  { key: 'gender',         label: 'جنسیت',              type: 'enum',
    enumOptions: [{ value: 'MALE', label: 'پسر' }, { value: 'FEMALE', label: 'دختر' }] },
  { key: 'birthYearShamsi',label: 'سال تولد (شمسی)',    type: 'number'  },
  { key: 'birthMonth',     label: 'ماه تولد',           type: 'number'  },
  // ─── تحصیلی ───────────────────────────────────
  { key: 'grade.label',    label: 'پایه تحصیلی',        type: 'string'  },
  { key: 'educationLevel.label', label: 'مقطع تحصیلی', type: 'string'  },
  { key: 'attendanceType', label: 'نوع حضور',            type: 'enum',
    enumOptions: [
      { value: 'SCHOOL_PRESENCE', label: 'حضوری' },
      { value: 'HOME_BASED',      label: 'خانه‌محور' },
      { value: 'DAY_CARE',        label: 'روزانه' },
    ]},
  // ─── مرکز و ناحیه ─────────────────────────────
  { key: 'center.name',    label: 'نام مدرسه',           type: 'string'  },
  { key: 'district.label', label: 'ناحیه',               type: 'string'  },
  // ─── ولی قانونی ───────────────────────────────
  { key: 'guardianName',   label: 'نام ولی قانونی',      type: 'string'  },
  { key: 'guardianPhone',  label: 'تلفن ولی',            type: 'string'  },
  { key: 'homePhone',      label: 'تلفن منزل',           type: 'string'  },
  // ─── وضعیت ────────────────────────────────────
  { key: 'isActive',       label: 'فعال',                type: 'boolean' },
  { key: 'isMartyrFamily', label: 'خانواده شهید',        type: 'boolean' },
  { key: 'isOrphan',       label: 'ایتام',               type: 'boolean' },
  { key: 'isUnderWelfare', label: 'تحت پوشش بهزیستی',   type: 'boolean' },
  { key: 'needsSpeechTherapy',      label: 'نیاز به گفتاردرمانی', type: 'boolean' },
  { key: 'needsOccupationalTherapy',label: 'نیاز به کاردرمانی',   type: 'boolean' },
  { key: 'needsPhysiotherapy',      label: 'نیاز به فیزیوتراپی',  type: 'boolean' },
];

const EXCEL_COLS: AvailableColumn[] = [
  { field: 'fullName',           header: 'نام و نام خانوادگی', width: 24 },
  { field: 'nationalCode',       header: 'کد ملی',              width: 14 },
  { field: 'genderLabel',        header: 'جنسیت',               width: 8  },
  { field: 'age',                header: 'سن',                  width: 6  },
  { field: 'birthShamsi',        header: 'تاریخ تولد',          width: 14 },
  { field: 'educationLevelLabel',header: 'مقطع',                width: 14 },
  { field: 'gradeLabel',         header: 'پایه',                width: 14 },
  { field: 'centerName',         header: 'مدرسه',               width: 22 },
  { field: 'districtLabel',      header: 'ناحیه',               width: 14 },
  { field: 'guardianName',       header: 'ولی قانونی',          width: 18 },
  { field: 'guardianPhone',      header: 'تلفن ولی',            width: 14 },
  { field: 'disabilityLabels',   header: 'نوع معلولیت',         width: 22 },
  { field: 'isMultipleDisabilityLabel', header: 'چندمعلولیتی',  width: 12 },
  { field: 'currentStatus',      header: 'وضعیت',               width: 14 },
];

@Component({
  selector: 'maz-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SmartFilterComponent, ExcelExportDialogComponent, ConfirmDialogComponent, StatusBadgeComponent],
  template: `
    <div class="maz-page-header">
      <div class="maz-page-header__title">دانش‌آموزان</div>
      <div class="maz-page-header__actions">
        <button class="maz-btn maz-btn--ghost maz-btn--sm" (click)="showExcel=true">خروجی اکسل</button>
        <a class="maz-btn maz-btn--primary maz-btn--sm" routerLink="/students/new">+ افزودن دانش‌آموز</a>
      </div>
    </div>

    <maz-smart-filter [fields]="filterFields" (filterChange)="onFilter($event)" />

    <div class="maz-card" style="overflow-x:auto">
      @if (loading()) {
        <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
      }
      <table class="maz-table" style="min-width:900px">
        <thead><tr>
          <th style="width:40px">#</th>
          <th>نام و نام خانوادگی</th>
          <th>کد ملی</th>
          <th>سن</th>
          <th>مقطع / پایه</th>
          <th>کلاس / معلم</th>
          <th>معلولیت</th>
          <th>وضعیت</th>
          <th>عملیات</th>
        </tr></thead>
        <tbody>
          @for (s of students(); track s.id; let i = $index) {
            <tr>
              <td class="maz-text-muted">{{ rowNum(i) }}</td>
              <td>
                <div style="font-weight:700">{{ s.firstName }} {{ s.lastName }}</div>
                <div style="font-size:11px;color:var(--maz-gray-400)">{{ s.gender === 'MALE' ? 'پسر' : 'دختر' }}</div>
              </td>
              <td class="maz-text-sm maz-text-muted">{{ s.nationalCode }}</td>
              <td style="font-weight:700;color:var(--maz-firouzeh-700)">{{ age(s) }}</td>
              <td>
                <div style="font-size:12px">{{ eduLevelLabel(s) }}</div>
                <div style="font-size:11px;color:var(--maz-gray-400)">{{ gradeLabel(s) }}</div>
              </td>
              <td>
                @if (getClassAssignment(s)) {
                  <a [routerLink]="['/classes', getClassAssignment(s)!.classRoom?.id]"
                    style="font-size:12px;font-weight:600;color:var(--maz-firouzeh-600)">
                    {{ getClassAssignment(s)!.classRoom?.name }}
                  </a>
                  <div style="font-size:11px;color:var(--maz-gray-400)">{{ getTeacherName(s) }}</div>
                } @else {
                  <span class="maz-text-muted maz-text-sm">—</span>
                }
              </td>
              <td>
                @if (isMultiple(s)) { <span style="font-size:10px;background:var(--maz-gold-100);color:var(--maz-gold-700);padding:2px 6px;border-radius:4px;font-weight:700">چندمعلولیتی</span> }
                <div style="font-size:11px">{{ disabilityLabels(s) }}</div>
              </td>
              <td>
                <maz-status-badge [label]="statusLabel(s)" variant="active" />
              </td>
              <td>
                <div class="action-btns">
                  <a class="maz-btn maz-btn--outline maz-btn--sm" [routerLink]="['/students', s.id]">مشاهده</a>
                  <a class="maz-btn maz-btn--ghost maz-btn--sm" [routerLink]="['/students', s.id, 'edit']">ویرایش</a>
                </div>
              </td>
            </tr>
          }
          @if (!students().length && !loading()) {
            <tr class="maz-table--empty"><td colspan="9">هیچ دانش‌آموزی یافت نشد</td></tr>
          }
        </tbody>
      </table>
      @if (result() && result()!.pageCount > 1) {
        <div class="maz-pagination">
          <button class="maz-btn maz-btn--ghost maz-btn--sm" [disabled]="page()<=1" (click)="goPage(page()-1)">قبلی</button>
          <span>{{ page() }} از {{ result()!.pageCount }}</span>
          <button class="maz-btn maz-btn--ghost maz-btn--sm" [disabled]="page()>=result()!.pageCount" (click)="goPage(page()+1)">بعدی</button>
        </div>
      }
    </div>

    @if (showExcel) {
      <maz-excel-export-dialog [availableColumns]="excelCols" entityName="دانش‌آموزان"
        (export)="onExcel($event)" (close)="showExcel=false" />
    }
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
  activeFilters: FilterCondition[] = [];
  showExcel = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list(this.buildReq()).subscribe({
      next: r  => { this.result.set(r as any); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilter(f: FilterCondition[]) { this.activeFilters = f; this.page.set(1); this.load(); }
  goPage(p: number) { this.page.set(p); this.load(); }
  rowNum(i: number) { return (this.page() - 1) * this.pageSize + i + 1; }

  private buildReq(): SmartFilterRequest {
    return { filters: this.activeFilters, sort: { field: 'lastName', direction: 'asc' }, page: this.page(), pageSize: this.pageSize };
  }

  getClassAssignment(s: Student) { return (s as any).classAssignments?.[0] ?? null; }
  getTeacherName(s: Student): string {
    const t = this.getClassAssignment(s)?.classRoom?.teacherAssignments?.[0]?.user;
    return t ? `${t.firstName} ${t.lastName}` : '';
  }
  age(s: Student): string           { return (s as any).age != null ? String((s as any).age) : '—'; }
  eduLevelLabel(s: Student): string { return (s as any).educationLevel?.label ?? '—'; }
  isMultiple(s: Student): boolean   { return !!(s as any).isMultipleDisability; }
  statusLabel(s: Student): string   { return (s as any).studentStatusHistory?.[0]?.statusType?.label ?? 'مشغول'; }
  gradeLabel(s: Student): string    { return (s as any).grade?.label ?? '—'; }
  disabilityLabels(s: Student): string {
    return ((s as any).disabilities ?? []).map((d: any) => d.disabilityType?.label).filter(Boolean).join('، ') || '—';
  }

  onExcel(dto: ExcelExportRequest) {
    this.excel.download(
      this.api.exportExcel({ ...this.buildReq(), ...dto }),
      dto.filename ?? 'students'
    );
    this.showExcel = false;
  }
}
