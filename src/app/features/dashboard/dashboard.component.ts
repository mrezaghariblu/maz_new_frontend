// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AnalyticsApi } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { formatShamsi } from '../../shared/utils/shamsi.util';

const CHART_COLORS = ['#1e9aa4','#2db8c4','#9de3e9','#d97706','#059669','#7c3aed','#db2777','#2563eb','#166b72','#f59e0b','#5fcdd6','#1a838b'];

@Component({
  selector: 'maz-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  styles: [`
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(175px,1fr)); gap: 14px; margin-bottom: 24px;
    }
    .stat-card {
      padding: 18px 16px; border-radius: var(--maz-radius-lg);
      background: #fff; border: 1px solid var(--maz-border); transition: box-shadow .15s;
    }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(30,154,164,.1); }
    .stat-card.warn  { border-color: #f59e0b; background: #fffbeb; }
    .stat-icon { font-size: 24px; margin-bottom: 8px; }
    .stat-val  { font-size: 28px; font-weight: 900; color: var(--maz-firouzeh-800); }
    .stat-val.warn-val { color: #d97706; }
    .stat-lbl  { font-size: 11px; color: var(--maz-gray-500); margin-top: 2px; font-weight: 600; }
    .stat-hint { font-size: 11px; color: #d97706; margin-top: 4px; font-weight: 700; }

    /* Charts grid */
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px,1fr)); gap: 16px; margin-bottom: 20px; }
    .chart-card { background:#fff; border-radius: var(--maz-radius-lg); border: 1px solid var(--maz-border); padding: 18px; }
    .chart-title { font-size: 13px; font-weight: 800; color: var(--maz-firouzeh-900); margin-bottom: 14px; }

    /* Bar mini chart */
    .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .bar-label { width: 130px; font-size: 11px; text-align: right; flex-shrink: 0; color: var(--maz-gray-600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; background: var(--maz-gray-100); border-radius: 3px; height: 20px; }
    .bar-fill  { height: 100%; border-radius: 3px; display: flex; align-items: center; padding: 0 6px; transition: width .4s; min-width: 24px; }
    .bar-val   { font-size: 10px; font-weight: 700; color: #fff; }
    .bar-pct   { width: 36px; font-size: 11px; color: var(--maz-gray-400); flex-shrink: 0; text-align: left; }

    /* Pie chart */
    .pie-wrap { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .pie-legend { flex: 1; min-width: 120px; }
    .legend-item { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; font-size: 12px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    /* Unassigned panel */
    .unassigned-panel {
      background: #fff; border-radius: var(--maz-radius-lg); border: 1.5px solid #fbbf24;
      margin-bottom: 20px; overflow: hidden;
    }
    .unassigned-header {
      background: #fffbeb; padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    }
    .unassigned-title { font-size: 13px; font-weight: 800; color: #92400e; display: flex; align-items: center; gap: 8px; }
    .badge-count { background: #f59e0b; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 900; }
    .students-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .students-table th { background: #fef3c7; color: #92400e; font-weight: 800; padding: 8px 12px; text-align: right; border-bottom: 2px solid #fbbf24; }
    .students-table td { padding: 8px 12px; border-bottom: 1px solid #fef3c7; }
    .students-table tr:last-child td { border-bottom: none; }
    .students-table tr:hover td { background: #fffbeb; }
    .gender-badge { padding: 2px 7px; border-radius: 8px; font-size: 10px; font-weight: 700; }
    .gender-badge.male   { background: #dbeafe; color: #1e40af; }
    .gender-badge.female { background: #fce7f3; color: #9d174d; }
    .d-chip { padding: 1px 6px; border-radius: 8px; font-size: 10px; background: var(--maz-firouzeh-50); color: var(--maz-firouzeh-700); font-weight: 600; margin: 1px; display: inline-block; }
    .action-link { font-size: 11px; color: var(--maz-firouzeh-600); font-weight: 700; text-decoration: none; padding: 2px 6px; border-radius: 4px; }
    .action-link:hover { background: var(--maz-firouzeh-50); }

    /* Quick links */
    .quick-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px,1fr)); gap: 10px; }
    .quick-link {
      display: flex; align-items: center; gap: 8px; padding: 12px 13px;
      border-radius: var(--maz-radius-md); border: 1.5px solid var(--maz-border);
      background: #fff; text-decoration: none; color: var(--maz-gray-700);
      font-size: 12px; font-weight: 600; transition: all .15s;
    }
    .quick-link:hover { border-color: var(--maz-firouzeh-400); background: var(--maz-firouzeh-50); color: var(--maz-firouzeh-800); }
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

      <!-- ─── کارت‌های آماری ─── -->
      <div class="stats-grid">
        @if (auth.isSuperuser()) {
          <div class="stat-card">
            <div class="stat-icon">🎓</div>
            <div class="stat-val">{{ summary()?.totalStudents | number }}</div>
            <div class="stat-lbl">دانش‌آموز فعال</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-val">{{ summary()?.totalPersonnel | number }}</div>
            <div class="stat-lbl">پرسنل فعال</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏫</div>
            <div class="stat-val">{{ summary()?.totalCenters | number }}</div>
            <div class="stat-lbl">مرکز آموزشی</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-val">{{ summary()?.totalClasses | number }}</div>
            <div class="stat-lbl">کلاس فعال</div>
          </div>
          @if ((summary()?.unassignedStudents ?? 0) > 0) {
            <div class="stat-card warn">
              <div class="stat-icon">⚠️</div>
              <div class="stat-val warn-val">{{ summary()?.unassignedStudents | number }}</div>
              <div class="stat-lbl">کلاسبندی‌نشده</div>
              <div class="stat-hint">در کل استان</div>
            </div>
          }
        } @else {
          <div class="stat-card">
            <div class="stat-icon">🎓</div>
            <div class="stat-val">{{ summary()?.totalStudents | number }}</div>
            <div class="stat-lbl">دانش‌آموز فعال</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-val">{{ summary()?.totalPersonnel | number }}</div>
            <div class="stat-lbl">پرسنل فعال</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-val">{{ summary()?.totalClasses | number }}</div>
            <div class="stat-lbl">کلاس فعال</div>
          </div>
          <div class="stat-card" [class.warn]="(summary()?.unassignedStudents ?? 0) > 0">
            <div class="stat-icon">{{ (summary()?.unassignedStudents ?? 0) > 0 ? '⚠️' : '✅' }}</div>
            <div class="stat-val" [class.warn-val]="(summary()?.unassignedStudents ?? 0) > 0">
              {{ summary()?.unassignedStudents | number }}
            </div>
            <div class="stat-lbl">کلاسبندی‌نشده</div>
            @if ((summary()?.unassignedStudents ?? 0) > 0) {
              <div class="stat-hint">نیاز به اقدام</div>
            }
          </div>
        }
      </div>

      <!-- ─── نمودارها ─── -->
      <div class="charts-grid">

        <!-- توزیع معلولیت -->
        @if (summary()?.byDisability?.length) {
          <div class="chart-card">
            <div class="chart-title">توزیع نوع معلولیت دانش‌آموزان</div>
            @for (row of summary()!.byDisability.slice(0,8); track row.key; let i = $index) {
              <div class="bar-row">
                <div class="bar-label" [title]="row.label">{{ row.label }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="row.percentage" [style.background]="color(i)">
                    <span class="bar-val">{{ row.count }}</span>
                  </div>
                </div>
                <div class="bar-pct">{{ row.percentage }}%</div>
              </div>
            }
          </div>
        }

        <!-- توزیع پایه -->
        @if (summary()?.byGrade?.length) {
          <div class="chart-card">
            <div class="chart-title">توزیع پایه تحصیلی</div>
            @for (row of summary()!.byGrade.slice(0,8); track row.key; let i = $index) {
              <div class="bar-row">
                <div class="bar-label" [title]="row.label">{{ row.label }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="row.percentage" [style.background]="color(i+2)">
                    <span class="bar-val">{{ row.count }}</span>
                  </div>
                </div>
                <div class="bar-pct">{{ row.percentage }}%</div>
              </div>
            }
          </div>
        }

        <!-- جنسیت دانش‌آموزان (دایره) -->
        @if (summary()?.byGender?.length) {
          <div class="chart-card">
            <div class="chart-title">توزیع جنسیت دانش‌آموزان</div>
            <div class="pie-wrap">
              <svg width="140" height="140" viewBox="0 0 140 140">
                @for (slice of genderSlices(); track slice.key; let i = $index) {
                  <path [attr.d]="slice.d" [attr.fill]="color(i)" stroke="#fff" stroke-width="2">
                    <title>{{ slice.label }}: {{ slice.count }}</title>
                  </path>
                }
              </svg>
              <div class="pie-legend">
                @for (row of summary()!.byGender; track row.key; let i = $index) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background]="color(i)"></span>
                    <span>{{ row.label }}</span>
                    <strong style="margin-right:auto">{{ row.count }}</strong>
                    <span style="color:var(--maz-gray-400);font-size:11px">{{ row.percentage }}%</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- پرسنل بر اساس پست (سوپریوزر) -->
        @if (auth.isSuperuser() && summary()?.personnelByJobPosition?.length) {
          <div class="chart-card">
            <div class="chart-title">توزیع پست سازمانی پرسنل</div>
            @for (row of summary()!.personnelByJobPosition.slice(0,8); track row.key; let i = $index) {
              <div class="bar-row">
                <div class="bar-label" [title]="row.label">{{ row.label }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="row.percentage" [style.background]="color(i+4)">
                    <span class="bar-val">{{ row.count }}</span>
                  </div>
                </div>
                <div class="bar-pct">{{ row.percentage }}%</div>
              </div>
            }
          </div>
        }

        <!-- توزیع ناحیه (سوپریوزر) -->
        @if (auth.isSuperuser() && summary()?.byDistrict?.length) {
          <div class="chart-card">
            <div class="chart-title">توزیع دانش‌آموزان به تفکیک ناحیه</div>
            @for (row of summary()!.byDistrict.slice(0,8); track row.key; let i = $index) {
              <div class="bar-row">
                <div class="bar-label" [title]="row.label">{{ row.label }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="row.percentage" [style.background]="color(i+1)">
                    <span class="bar-val">{{ row.count }}</span>
                  </div>
                </div>
                <div class="bar-pct">{{ row.percentage }}%</div>
              </div>
            }
          </div>
        }
      </div>

      <!-- ─── لیست کلاسبندی‌نشده (مدیر مرکز) ─── -->
      @if (!auth.isSuperuser() && unassignedList().length > 0) {
        <div class="unassigned-panel">
          <div class="unassigned-header">
            <div class="unassigned-title">
              ⚠️ دانش‌آموزان کلاسبندی‌نشده
              <span class="badge-count">{{ summary()?.unassignedStudents }}</span>
            </div>
            <a class="action-link" routerLink="/classes">رفتن به کلاسبندی ←</a>
          </div>
          <div style="overflow-x:auto">
            <table class="students-table">
              <thead>
                <tr>
                  <th>نام و نام خانوادگی</th>
                  <th>جنسیت</th>
                  <th>تاریخ تولد</th>
                  <th>پایه</th>
                  <th>معلولیت‌ها</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (s of unassignedList(); track s.id) {
                  <tr>
                    <td style="font-weight:700">{{ s.firstName }} {{ s.lastName }}</td>
                    <td>
                      <span class="gender-badge" [class.male]="s.gender==='MALE'" [class.female]="s.gender==='FEMALE'">
                        {{ s.gender === 'MALE' ? 'پسر' : 'دختر' }}
                      </span>
                    </td>
                    <td style="direction:ltr;text-align:right;font-size:11px">
                      {{ formatBirth(s) }}
                    </td>
                    <td style="font-size:12px">{{ s.grade?.label ?? '—' }}</td>
                    <td>
                      @for (d of s.disabilities ?? []; track d.disabilityTypeId) {
                        <span class="d-chip">{{ d.disabilityType?.label }}</span>
                      }
                      @if (!(s.disabilities?.length)) {
                        <span style="color:var(--maz-gray-400)">—</span>
                      }
                    </td>
                    <td><a class="action-link" [routerLink]="['/students', s.id]">مشاهده ←</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if ((summary()?.unassignedStudents ?? 0) > unassignedList().length) {
            <div style="padding:8px 16px;font-size:11px;color:var(--maz-gray-500);border-top:1px solid #fef3c7">
              نمایش {{ unassignedList().length }} نفر از {{ summary()?.unassignedStudents }} نفر —
              <a class="action-link" routerLink="/students">مشاهده همه ←</a>
            </div>
          }
        </div>
      }

      <!-- ─── دسترسی سریع ─── -->
      <div class="maz-card">
        <div style="font-size:12px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:12px">دسترسی سریع</div>
        <div class="quick-links">
          <a class="quick-link" routerLink="/users">        👤 پرسنل</a>
          <a class="quick-link" routerLink="/students">     🎓 دانش‌آموزان</a>
          <a class="quick-link" routerLink="/classes">      📚 کلاسبندی</a>
          @if (auth.isSuperuser()) {
            <a class="quick-link" routerLink="/centers">    🏫 مراکز</a>
            <a class="quick-link" routerLink="/analytics">  📊 گزارش آماری</a>
            <a class="quick-link" routerLink="/academic-years">📅 سال تحصیلی</a>
            <a class="quick-link" routerLink="/audit">      📋 لاگ تغییرات</a>
          }
          <a class="quick-link" routerLink="/status">       🔄 وضعیت پرسنلی</a>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private analyticsApi = inject(AnalyticsApi);
  readonly appState    = inject(AppStateService);
  readonly auth        = inject(AuthService);

  loading       = signal(true);
  summary       = signal<any | null>(null);
  unassignedList = signal<any[]>([]);

  ngOnInit() {
    const yearId = this.appState.activeYearId() ?? undefined;

    if (this.auth.isSuperuser()) {
      this.analyticsApi.superuserSummary(yearId).pipe(catchError(() => of(null))).subscribe(s => {
        this.summary.set(s);
        this.loading.set(false);
      });
    } else {
      const centerId = this.auth.centerIds()[0];
      if (centerId) {
        this.analyticsApi.centerSummary(centerId, yearId).pipe(catchError(() => of(null))).subscribe(s => {
          this.summary.set(s);
          this.unassignedList.set(s?.unassignedList ?? []);
          this.loading.set(false);
        });
      } else {
        this.loading.set(false);
      }
    }
  }

  formatBirth(s: any): string {
    return formatShamsi(s.birthYearShamsi, s.birthMonth, s.birthDay);
  }

  color(i: number) { return CHART_COLORS[i % CHART_COLORS.length]; }

  genderSlices() {
    const rows: any[] = this.summary()?.byGender ?? [];
    const total = rows.reduce((s: number, r: any) => s + r.count, 0);
    if (!total) return [];
    const cx = 70, cy = 70, r = 65;
    let angle = -Math.PI / 2;
    return rows.map((row: any) => {
      const frac = row.count / total;
      const sa = angle;
      angle += frac * 2 * Math.PI;
      const large = frac > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(sa),  y1 = cy + r * Math.sin(sa);
      const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
      return { key: row.key, label: row.label, count: row.count, d: `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}Z` };
    });
  }
}
