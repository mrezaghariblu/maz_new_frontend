import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditApi } from '../../../core/services/api.service';
import { AuditLog, PagedResult, USER_TYPE_LABEL } from '../../../core/models';

@Component({
  selector: 'maz-audit-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
    .action-badge {
      display: inline-flex; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;
      &.create { background: #dcfce7; color: #166534; }
      &.update { background: #dbeafe; color: #1e40af; }
      &.delete { background: #fee2e2; color: #991b1b; }
    }
  `],
  template: `
    <div class="maz-page-header">
      <div>
        <div class="maz-page-header__title">لاگ تغییرات</div>
        <div class="maz-page-header__sub">{{ result()?.total ?? 0 }} رکورد</div>
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
                <th>#</th><th>موجودیت</th><th>عملیات</th><th>شناسه</th><th>کاربر</th><th>سال تحصیلی</th><th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id; let i = $index) {
                <tr>
                  <td class="maz-text-muted">{{ rowNum(i) }}</td>
                  <td>{{ entityLabel(log.entity) }}</td>
                  <td>
                    <span class="action-badge" [class]="log.action.toLowerCase()">{{ actionLabel(log.action) }}</span>
                  </td>
                  <td class="maz-text-muted">{{ log.entityId }}</td>
                  <td>
                    @if (log.performedBy) {
                      {{ log.performedBy.firstName }} {{ log.performedBy.lastName }}
                      <span class="maz-text-muted maz-text-sm">({{ userTypeLabel(log.performedBy.userType) }})</span>
                    } @else { — }
                  </td>
                  <td>{{ log.academicYear?.label ?? '—' }}</td>
                  <td class="maz-text-sm maz-text-muted">{{ log.createdAt | date:'yyyy/MM/dd HH:mm' }}</td>
                </tr>
              }
              @if (!logs().length) {
                <tr class="maz-table--empty"><td [colSpan]="7">هیچ لاگی یافت نشد</td></tr>
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
  `,
})
export class AuditListComponent implements OnInit {
  private api = inject(AuditApi);

  loading = signal(true);
  result  = signal<PagedResult<AuditLog> | null>(null);
  logs    = computed(() => this.result()?.data ?? []);
  page    = signal(1);
  pageSize = 20;
  pageCount = computed(() => this.result()?.pageCount ?? 1);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list({ page: this.page(), pageSize: this.pageSize, sort: { field: 'createdAt', direction: 'desc' } }).subscribe({
      next:  r  => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goPage(p: number) { if (p < 1 || p > this.pageCount()) return; this.page.set(p); this.load(); }
  rowNum(i: number) { return (this.page() - 1) * this.pageSize + i + 1; }

  entityLabel(e: string) {
    const map: Record<string, string> = { User: 'پرسنل', Student: 'دانش‌آموز', Center: 'مرکز', AcademicYear: 'سال تحصیلی' };
    return map[e] ?? e;
  }

  actionLabel(a: string) {
    const map: Record<string, string> = { CREATE: 'ایجاد', UPDATE: 'ویرایش', DELETE: 'حذف' };
    return map[a] ?? a;
  }

  userTypeLabel(t: string) { return USER_TYPE_LABEL[t as keyof typeof USER_TYPE_LABEL] ?? t; }
}
