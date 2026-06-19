import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersApi, StudentsApi, CentersApi } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';

@Component({
  selector: 'maz-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 28px;
    }
    .stat-card {
      padding: 20px 22px; border-radius: var(--maz-radius-lg);
      background: #fff; border: 1px solid var(--maz-border);
      .stat-icon { font-size: 28px; margin-bottom: 10px; }
      .stat-val  { font-size: 28px; font-weight: 900; color: var(--maz-firouzeh-800); }
      .stat-lbl  { font-size: 12px; color: var(--maz-gray-500); margin-top: 4px; font-weight: 600; }
    }
    .quick-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .quick-link {
      display: flex; align-items: center; gap: 10px; padding: 14px 16px;
      border-radius: var(--maz-radius-md); border: 1.5px solid var(--maz-border);
      background: #fff; text-decoration: none; color: var(--maz-gray-700);
      font-size: 13px; font-weight: 600; transition: all .15s;
      &:hover { border-color: var(--maz-firouzeh-400); background: var(--maz-firouzeh-50); color: var(--maz-firouzeh-800); }
      .ql-icon { font-size: 20px; }
    }
  `],
  template: `
    <div class="maz-page-header">
      <div>
        <div class="maz-page-header__title">داشبورد</div>
        <div class="maz-page-header__sub">
          @if (appState.activeYear(); as y) { سال تحصیلی {{ y.label }} }
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else {
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-val">{{ userCount() }}</div>
          <div class="stat-lbl">پرسنل فعال</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-val">{{ studentCount() }}</div>
          <div class="stat-lbl">دانش‌آموز</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏫</div>
          <div class="stat-val">{{ centerCount() }}</div>
          <div class="stat-lbl">مراکز آموزشی</div>
        </div>
      </div>

      <div class="maz-card">
        <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">دسترسی سریع</div>
        <div class="quick-links">
          <a class="quick-link" routerLink="/users"><span class="ql-icon">👤</span> پرسنل</a>
          <a class="quick-link" routerLink="/students"><span class="ql-icon">🎓</span> دانش‌آموزان</a>
          <a class="quick-link" routerLink="/centers"><span class="ql-icon">🏫</span> مراکز</a>
          <a class="quick-link" routerLink="/status"><span class="ql-icon">🔄</span> وضعیت پرسنلی</a>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private usersApi    = inject(UsersApi);
  private studentsApi = inject(StudentsApi);
  private centersApi  = inject(CentersApi);
  readonly appState   = inject(AppStateService);

  loading = signal(true);
  userCount = signal(0);
  studentCount = signal(0);
  centerCount = signal(0);

  ngOnInit() {
    const req = { page: 1, pageSize: 1, filters: [{ field: 'isActive', fieldType: 'boolean' as const, operator: 'is_true', order: 1 }] };
    this.usersApi.list(req).subscribe({
      next: r => this.userCount.set(r.total),
      error: () => {},
    });
    this.studentsApi.list(req).subscribe({
      next: r => this.studentCount.set(r.total),
      error: () => {},
    });
    this.centersApi.list({ page: 1, pageSize: 1 }).subscribe({
      next: r => { this.centerCount.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
