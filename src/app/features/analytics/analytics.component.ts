// src/app/features/analytics/analytics.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsApi } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { formatShamsi, gregorianToShamsi } from '../../shared/utils/shamsi.util';
import { catchError, of } from 'rxjs';

interface DimOption  { value: string; label: string; }
interface Row { key: string; label: string; count: number; percentage: number; children?: Row[]; }

const DIMS: Record<string, DimOption[]> = {
  STUDENT: [
    { value: 'DISTRICT',              label: 'ناحیه / منطقه' },
    { value: 'CENTER',                label: 'مرکز آموزشی' },
    { value: 'EDUCATION_LEVEL',       label: 'مقطع تحصیلی' },
    { value: 'GRADE',                 label: 'پایه تحصیلی' },
    { value: 'DISABILITY_TYPE',       label: 'نوع معلولیت' },
    { value: 'IS_MULTIPLE_DISABILITY',label: 'وضعیت چندمعلولیتی' },
    { value: 'GENDER',                label: 'جنسیت' },
    { value: 'ATTENDANCE_TYPE',       label: 'نوع حضور' },
  ],
  USER: [
    { value: 'DISTRICT',       label: 'ناحیه / منطقه' },
    { value: 'CENTER',         label: 'مرکز آموزشی' },
    { value: 'USER_TYPE',      label: 'نقش' },
    { value: 'JOB_POSITION',   label: 'پست سازمانی' },
    { value: 'EMPLOYMENT_TYPE',label: 'نوع استخدام' },
    { value: 'GENDER',         label: 'جنسیت' },
    { value: 'MARITAL_STATUS', label: 'وضعیت تأهل' },
  ],
  CENTER: [
    { value: 'DISTRICT',    label: 'ناحیه / منطقه' },
    { value: 'CENTER_TYPE', label: 'نوع مرکز' },
  ],
};

const COLORS = ['#1e9aa4','#2db8c4','#5fcdd6','#9de3e9','#166b72','#1a838b','#d97706','#f59e0b','#059669','#2563eb','#7c3aed','#db2777','#0ea5e9','#65a30d'];

@Component({
  selector: 'maz-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  styles: [`
    .layout { display: grid; grid-template-columns: 260px 1fr; gap: 18px; align-items: start; }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }

    /* Sidebar */
    .sidebar { background:#fff; border-radius:var(--maz-radius-lg); border:1px solid var(--maz-border); padding:18px; position:sticky; top:16px; }
    .section-label { font-size:11px; font-weight:800; color:var(--maz-firouzeh-900); letter-spacing:.5px; text-transform:uppercase; margin:14px 0 8px; }
    .section-label:first-child { margin-top:0; }

    .entity-btns { display:flex; gap:6px; flex-wrap:wrap; }
    .ent-btn {
      padding:5px 12px; border-radius:16px; border:1.5px solid var(--maz-border);
      font-size:12px; font-weight:700; cursor:pointer; background:#fff; font-family:var(--maz-font);
      transition:all .12s;
    }
    .ent-btn.active { background:var(--maz-firouzeh-600); color:#fff; border-color:var(--maz-firouzeh-600); }

    .dim-item {
      display:flex; align-items:center; gap:8px; padding:7px 9px;
      border-radius:8px; font-size:12px; cursor:pointer; user-select:none;
      transition:background .1s;
    }
    .dim-item:hover { background:var(--maz-gray-50); }
    .dim-item.selected { background:var(--maz-firouzeh-50); color:var(--maz-firouzeh-800); font-weight:700; }
    .dim-num {
      width:17px; height:17px; border-radius:50%; background:var(--maz-firouzeh-500);
      color:#fff; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .dim-circle {
      width:17px; height:17px; border-radius:50%; border:1.5px dashed var(--maz-gray-300); flex-shrink:0;
    }

    .run-btn { width:100%; margin-top:14px; }

    /* Results */
    .result-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .result-total { font-size:26px; font-weight:900; color:var(--maz-firouzeh-800); }
    .result-sub   { font-size:11px; color:var(--maz-gray-500); margin-top:2px; }
    .result-date  { font-size:11px; color:var(--maz-gray-400); }

    .chart-tabs { display:flex; gap:4px; margin-bottom:14px; flex-wrap:wrap; }
    .chart-tab {
      padding:5px 13px; border-radius:7px; border:1px solid var(--maz-border);
      font-size:12px; font-weight:700; cursor:pointer; background:#fff; font-family:var(--maz-font); transition:all .12s;
    }
    .chart-tab.active { background:var(--maz-firouzeh-600); color:#fff; border-color:var(--maz-firouzeh-600); }

    /* Bar chart */
    .bar-wrap { padding:4px 0; }
    .bar-row { display:flex; align-items:center; gap:8px; margin-bottom:9px; }
    .bar-label { width:140px; font-size:11px; text-align:right; flex-shrink:0; color:var(--maz-gray-700); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .bar-track { flex:1; background:var(--maz-gray-100); border-radius:4px; height:22px; min-width:60px; }
    .bar-fill  { height:100%; border-radius:4px; display:flex; align-items:center; padding:0 7px; transition:width .4s ease; min-width:28px; }
    .bar-cnt   { font-size:10px; font-weight:700; color:#fff; white-space:nowrap; }
    .bar-pct   { width:40px; font-size:11px; color:var(--maz-gray-400); flex-shrink:0; }

    /* Pie */
    .pie-wrap   { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; }
    .pie-legend { flex:1; min-width:160px; }
    .leg-item   { display:flex; align-items:center; gap:7px; margin-bottom:8px; font-size:12px; }
    .leg-dot    { width:11px; height:11px; border-radius:50%; flex-shrink:0; }

    /* Table */
    .data-table { width:100%; border-collapse:collapse; font-size:12px; }
    .data-table th { background:var(--maz-firouzeh-50); color:var(--maz-firouzeh-900); font-weight:800; padding:9px 11px; text-align:right; border-bottom:2px solid var(--maz-firouzeh-200); }
    .data-table td { padding:8px 11px; border-bottom:1px solid var(--maz-border); }
    .data-table tr:hover td { background:var(--maz-gray-50); }
    .num-td  { font-weight:700; color:var(--maz-firouzeh-700); }
    .pct-td  { color:var(--maz-gray-400); }
    .exp-btn { background:none; border:none; cursor:pointer; color:var(--maz-firouzeh-600); font-size:11px; font-weight:700; padding:2px 6px; border-radius:4px; font-family:var(--maz-font); }
    .exp-btn:hover { background:var(--maz-firouzeh-50); }
    .child-table { margin:4px 0 6px 20px; width:calc(100% - 20px); border-radius:6px; overflow:hidden; border:1px solid var(--maz-border); }
    .child-table th { background:var(--maz-gray-50); font-size:11px; padding:6px 10px; font-weight:700; }
    .child-table td { font-size:11px; padding:6px 10px; }

    .empty { text-align:center; padding:48px; color:var(--maz-gray-400); font-size:14px; }
    .empty-icon { font-size:40px; margin-bottom:10px; }
  `],
  template: `
    <div class="maz-page-header">
      <div class="maz-page-header__title">گزارش‌گیری آماری</div>
    </div>

    <div class="layout">

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="section-label">موجودیت</div>
        <div class="entity-btns">
          @for (e of entities; track e.value) {
            <button class="ent-btn" [class.active]="entity()===e.value" (click)="setEntity(e.value)">{{ e.label }}</button>
          }
        </div>

        <div class="section-label">سال تحصیلی</div>
        <select class="maz-select" [(ngModel)]="yearId">
          <option [ngValue]="null">همه سال‌ها</option>
          @for (y of appState.years(); track y.id) { <option [ngValue]="y.id">{{ y.label }}</option> }
        </select>

        <div class="section-label">
          ابعاد
          <span style="font-size:10px;font-weight:400;color:var(--maz-gray-400)">(ترتیب مهم است)</span>
        </div>
        @for (d of dims(); track d.value) {
          <div class="dim-item" [class.selected]="isSelected(d.value)" (click)="toggleDim(d.value)">
            @if (isSelected(d.value)) { <span class="dim-num">{{ order(d.value) }}</span> }
            @else                     { <span class="dim-circle"></span> }
            {{ d.label }}
          </div>
        }

        <button class="maz-btn maz-btn--primary run-btn" [disabled]="!dims().length || selectedDims().length===0 || loading()" (click)="run()">
          @if (loading()) { <span class="maz-spinner" style="width:13px;height:13px;border-width:2px;display:inline-block"></span> }
          اجرای گزارش
        </button>
      </div>

      <!-- Results -->
      <div>
        @if (!result() && !loading()) {
          <div class="maz-card empty">
            <div class="empty-icon">📊</div>
            موجودیت و ابعاد را انتخاب کنید، سپس گزارش را اجرا کنید
          </div>
        }

        @if (loading()) {
          <div class="maz-card" style="text-align:center;padding:56px">
            <div class="maz-spinner" style="width:32px;height:32px;border-width:3px;margin:0 auto 12px"></div>
            <div style="color:var(--maz-gray-400);font-size:13px">در حال پردازش...</div>
          </div>
        }

        @if (result() && !loading()) {
          <div class="maz-card">

            <div class="result-header">
              <div>
                <div class="result-total">{{ result()!.total | number }}</div>
                <div class="result-sub">{{ entityLabel() }} — {{ dimLabels() }}</div>
              </div>
              <div class="result-date">{{ genDate() }}</div>
            </div>

            <div class="chart-tabs">
              <button class="chart-tab" [class.active]="chart()==='bar'"   (click)="chart.set('bar')">📊 میله‌ای</button>
              <button class="chart-tab" [class.active]="chart()==='pie'"   (click)="chart.set('pie')">🥧 دایره‌ای</button>
              <button class="chart-tab" [class.active]="chart()==='table'" (click)="chart.set('table')">📋 جدول</button>
            </div>

            <!-- Bar chart -->
            @if (chart() === 'bar') {
              <div class="bar-wrap">
                @for (row of result()!.rows; track row.key; let i = $index) {
                  <div class="bar-row">
                    <div class="bar-label" [title]="row.label">{{ row.label }}</div>
                    <div class="bar-track">
                      <div class="bar-fill" [style.width.%]="row.percentage" [style.background]="clr(i)">
                        @if (row.percentage > 6) { <span class="bar-cnt">{{ row.count }}</span> }
                      </div>
                    </div>
                    <div class="bar-pct">{{ row.percentage }}%</div>
                  </div>
                }
              </div>
            }

            <!-- Pie chart -->
            @if (chart() === 'pie') {
              <div class="pie-wrap">
                <svg width="180" height="180" viewBox="0 0 180 180" style="flex-shrink:0">
                  @for (s of pieSlices(); track s.key; let i = $index) {
                    <path [attr.d]="s.d" [attr.fill]="clr(i)" stroke="#fff" stroke-width="2">
                      <title>{{ s.label }}: {{ s.count }} ({{ s.pct }}%)</title>
                    </path>
                  }
                </svg>
                <div class="pie-legend">
                  @for (row of result()!.rows.slice(0,12); track row.key; let i = $index) {
                    <div class="leg-item">
                      <span class="leg-dot" [style.background]="clr(i)"></span>
                      <span style="flex:1">{{ row.label }}</span>
                      <strong>{{ row.count }}</strong>
                      <span class="pct-td" style="margin-right:6px">{{ row.percentage }}%</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Table -->
            @if (chart() === 'table') {
              <div style="overflow-x:auto">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>{{ dim1Label() }}</th>
                      <th style="width:70px">تعداد</th>
                      <th style="width:70px">درصد</th>
                      @if (selectedDims().length > 1) { <th style="width:44px"></th> }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of result()!.rows; track row.key) {
                      <tr>
                        <td style="font-weight:600">{{ row.label }}</td>
                        <td class="num-td">{{ row.count | number }}</td>
                        <td class="pct-td">{{ row.percentage }}%</td>
                        @if (selectedDims().length > 1) {
                          <td>
                            <button class="exp-btn" (click)="toggleExpand(row.key)">
                              {{ expanded().has(row.key) ? '▲' : '▼' }}
                            </button>
                          </td>
                        }
                      </tr>
                      @if (expanded().has(row.key) && row.children?.length) {
                        <tr>
                          <td [attr.colspan]="selectedDims().length > 1 ? 4 : 3" style="padding:0">
                            <table class="child-table data-table">
                              <thead><tr><th>{{ dim2Label() }}</th><th>تعداد</th><th>درصد</th></tr></thead>
                              <tbody>
                                @for (ch of row.children!; track ch.key) {
                                  <tr>
                                    <td>{{ ch.label }}</td>
                                    <td class="num-td">{{ ch.count | number }}</td>
                                    <td class="pct-td">{{ ch.percentage }}%</td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            }

          </div>
        }
      </div>
    </div>
  `,
})
export class AnalyticsComponent implements OnInit {
  private api        = inject(AnalyticsApi);
  readonly appState  = inject(AppStateService);
  readonly auth      = inject(AuthService);

  entities = [
    { value: 'STUDENT', label: 'دانش‌آموزان' },
    { value: 'USER',    label: 'پرسنل' },
    { value: 'CENTER',  label: 'مراکز' },
  ];

  entity       = signal('STUDENT');
  selectedDims = signal<string[]>([]);
  yearId: number | null = null;
  loading      = signal(false);
  result       = signal<any | null>(null);
  chart        = signal<'bar'|'pie'|'table'>('bar');
  expanded     = signal<Set<string>>(new Set());

  dims = computed(() => DIMS[this.entity()] ?? []);

  ngOnInit() { this.yearId = this.appState.activeYearId() ?? null; }

  setEntity(e: string) { this.entity.set(e); this.selectedDims.set([]); this.result.set(null); }

  isSelected(v: string) { return this.selectedDims().includes(v); }
  order(v: string)       { return this.selectedDims().indexOf(v) + 1; }

  toggleDim(v: string) {
    this.selectedDims.update(d => d.includes(v) ? d.filter(x => x !== v) : [...d, v]);
  }

  toggleExpand(key: string) {
    this.expanded.update(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  run() {
    if (!this.selectedDims().length) return;
    this.loading.set(true);
    this.result.set(null);
    this.expanded.set(new Set());

    const dto: any = { entity: this.entity(), dimensions: this.selectedDims() };
    if (this.yearId) dto.academicYearId = this.yearId;
    if (!this.auth.isSuperuser() && this.auth.centerIds()[0])
      dto.centerId = this.auth.centerIds()[0];

    this.api.query(dto).pipe(catchError(() => of(null))).subscribe(r => {
      this.result.set(r);
      this.loading.set(false);
    });
  }

  clr(i: number) { return COLORS[i % COLORS.length]; }

  entityLabel() { return this.entities.find(e => e.value === this.entity())?.label ?? ''; }
  dimLabels()   { return this.selectedDims().map(d => this.dims().find(x => x.value === d)?.label).filter(Boolean).join(' × '); }
  dim1Label()   { return this.dims().find(d => d.value === this.selectedDims()[0])?.label ?? ''; }
  dim2Label()   { return this.dims().find(d => d.value === this.selectedDims()[1])?.label ?? ''; }

  genDate(): string {
    const iso = this.result()?.generatedAt;
    if (!iso) return '';
    const d = new Date(iso);
    const [jy, jm, jd] = gregorianToShamsi(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return formatShamsi(jy, jm, jd);
  }

  pieSlices = computed(() => {
    const rows: Row[] = this.result()?.rows ?? [];
    const total = rows.reduce((s, r) => s + r.count, 0);
    if (!total) return [];
    const cx = 90, cy = 90, r = 82;
    let angle = -Math.PI / 2;
    return rows.map(row => {
      const frac = row.count / total;
      const sa = angle;
      angle += frac * 2 * Math.PI;
      const lg = frac > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(sa),   y1 = cy + r * Math.sin(sa);
      const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
      return { key: row.key, label: row.label, count: row.count, pct: row.percentage, d: `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2}Z` };
    });
  });
}
