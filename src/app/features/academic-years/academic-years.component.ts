import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicYearsApi } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AcademicYear } from '../../core/models';

@Component({
  selector: 'maz-academic-years',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  styles: [`
    .year-grid { display: grid; gap: 12px; margin-bottom: 24px; }
    .year-card {
      display: flex; align-items: center; gap: 16px; padding: 16px 20px;
      border-radius: var(--maz-radius-md); border: 1.5px solid var(--maz-border); background: #fff;
      .year-label { font-size: 16px; font-weight: 800; color: var(--maz-gray-800); flex: 1; }
      .year-dates { font-size: 12px; color: var(--maz-gray-400); }
      .year-actions { display: flex; gap: 6px; }
    }
    .add-form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; align-items: end; }
    @media (max-width: 768px) { .add-form { grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="maz-page-header">
      <div>
        <div class="maz-page-header__title">سال‌های تحصیلی</div>
        <div class="maz-page-header__sub">{{ years().length }} سال</div>
      </div>
    </div>

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else {
      <div class="year-grid">
        @for (y of years(); track y.id) {
          <div class="year-card">
            <div>
              <div class="year-label">{{ y.label }}</div>
              <div class="year-dates">{{ y.startDate | date:'yyyy/MM/dd' }} — {{ y.endDate | date:'yyyy/MM/dd' }}</div>
            </div>
            @if (y.isActive) {
              <maz-status-badge label="فعال" variant="active" />
            } @else if (y.isArchived) {
              <maz-status-badge label="بایگانی" variant="inactive" />
            }
            <div class="year-actions">
              @if (!y.isActive && !y.isArchived) {
                <button class="maz-btn maz-btn--primary maz-btn--sm" (click)="activate(y)">فعال‌سازی</button>
              }
              @if (!y.isArchived) {
                <button class="maz-btn maz-btn--ghost maz-btn--sm" (click)="archive(y)">بایگانی</button>
              }
            </div>
          </div>
        }
      </div>

      <div class="maz-card">
        <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">+ سال تحصیلی جدید</div>
        <div class="add-form">
          <div class="maz-form-group" style="margin-bottom:0">
            <label class="maz-label">برچسب</label>
            <input class="maz-input" [(ngModel)]="newYear.label" placeholder="۱۴۰۴-۱۴۰۵" />
          </div>
          <div class="maz-form-group" style="margin-bottom:0">
            <label class="maz-label">شروع</label>
            <input class="maz-input" type="date" [(ngModel)]="newYear.startDate" />
          </div>
          <div class="maz-form-group" style="margin-bottom:0">
            <label class="maz-label">پایان</label>
            <input class="maz-input" type="date" [(ngModel)]="newYear.endDate" />
          </div>
          <button class="maz-btn maz-btn--primary" (click)="create()">+ افزودن</button>
        </div>
      </div>
    }
  `,
})
export class AcademicYearsComponent implements OnInit {
  private api      = inject(AcademicYearsApi);
  private appState = inject(AppStateService);

  loading = signal(true);
  years   = signal<AcademicYear[]>([]);
  newYear = { label: '', startDate: '', endDate: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next:  ys => { this.years.set(ys); this.appState.setYears(ys); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create() {
    if (!this.newYear.label || !this.newYear.startDate || !this.newYear.endDate) {
      this.appState.toast('همه فیلدها را پر کنید', 'warning');
      return;
    }
    this.api.create(this.newYear).subscribe({
      next: y => {
        this.years.update(ys => [...ys, y]);
        this.appState.toast('سال تحصیلی اضافه شد', 'success');
        this.newYear = { label: '', startDate: '', endDate: '' };
      },
      error: () => this.appState.toast('خطا در افزودن', 'error'),
    });
  }

  activate(y: AcademicYear) {
    this.api.activate(y.id).subscribe({
      next: updated => {
        this.years.update(ys => ys.map(x => ({ ...x, isActive: x.id === updated.id })));
        this.appState.setYears(this.years());
        this.appState.toast('سال تحصیلی فعال شد', 'success');
      },
      error: () => this.appState.toast('خطا در فعال‌سازی', 'error'),
    });
  }

  archive(y: AcademicYear) {
    this.api.archive(y.id).subscribe({
      next: updated => {
        this.years.update(ys => ys.map(x => x.id === updated.id ? updated : x));
        this.appState.toast('سال تحصیلی بایگانی شد', 'success');
      },
      error: () => this.appState.toast('خطا در بایگانی', 'error'),
    });
  }
}
