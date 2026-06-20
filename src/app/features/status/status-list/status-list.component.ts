// src/app/features/status/status-list/status-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { StatusApi }    from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthService }     from '../../../core/auth/auth.service';
import { StatusType }      from '../../../core/models';

@Component({
  selector: 'maz-status-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  styles: [`
    .status-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; margin-bottom: 28px; }
    .status-card { padding: 16px 18px; border-radius: var(--maz-radius-md); border: 1.5px solid var(--maz-border); background: #fff; position: relative; overflow: hidden;
      &::before { content:''; position:absolute; top:0;right:0; width:4px;height:100%; background:var(--maz-firouzeh-400); border-radius:0 4px 4px 0; }
      .sc-label { font-size:14px;font-weight:700;color:var(--maz-gray-800); }
      .sc-code  { font-size:11px;color:var(--maz-gray-400);margin-top:3px; }
    }
    .add-form { display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end; }
    @media (max-width:640px) { .add-form { grid-template-columns:1fr; } }
  `],
  template: `
    <div class="maz-page-header">
      <div>
        <div class="maz-page-header__title">انواع وضعیت پرسنلی</div>
        <div class="maz-page-header__sub">{{ types().length }} وضعیت تعریف‌شده</div>
      </div>
    </div>

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else {
      <div class="status-grid">
        @for (t of types(); track t.id) {
          <div class="status-card">
            <div class="sc-label">{{ t.label }}</div>
            <div class="sc-code">{{ t.code }}</div>
          </div>
        }
      </div>

      @if (auth.isSuperuser()) {
        <div class="maz-card" style="margin-bottom:24px">
          <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">+ تعریف وضعیت جدید</div>
          <div class="add-form">
            <div class="maz-form-group" style="margin-bottom:0">
              <label class="maz-label">کد انگلیسی</label>
              <input class="maz-input" [(ngModel)]="newCode" placeholder="مثلاً: SABBATICAL" />
            </div>
            <div class="maz-form-group" style="margin-bottom:0">
              <label class="maz-label">برچسب فارسی</label>
              <input class="maz-input" [(ngModel)]="newLabel" placeholder="مثلاً: مرخصی تحقیقاتی" />
            </div>
            <button class="maz-btn maz-btn--primary" (click)="addType()">+ افزودن</button>
          </div>
        </div>
      }

      <div class="maz-card" style="background:var(--maz-firouzeh-50);border-color:var(--maz-firouzeh-200)">
        <div style="font-size:14px;font-weight:700;color:var(--maz-firouzeh-800);margin-bottom:12px">💡 نحوه ثبت وضعیت</div>
        <div style="font-size:13px;color:var(--maz-firouzeh-700);line-height:2">
          برای ثبت وضعیت پرسنل، به
          <a routerLink="/users" style="font-weight:700;color:var(--maz-firouzeh-600)">صفحه پرسنل</a>
          بروید، «مشاهده» را بزنید و از دکمه «+ ثبت وضعیت» استفاده کنید.
        </div>
      </div>
    }
  `,
})
export class StatusListComponent implements OnInit {
  private statusApi = inject(StatusApi);
  readonly appState = inject(AppStateService);
  readonly auth     = inject(AuthService);

  loading  = signal(true);
  types    = signal<StatusType[]>([]);
  newCode  = '';
  newLabel = '';

  ngOnInit() {
    this.statusApi.getTypes('PERSONNEL').subscribe({
      next: t  => { this.types.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  addType() {
    if (!this.newCode.trim() || !this.newLabel.trim()) { this.appState.toast('کد و برچسب را وارد کنید', 'warning'); return; }
    this.statusApi.createType({ target: 'PERSONNEL', code: this.newCode.trim().toUpperCase(), label: this.newLabel.trim(), sortOrder: this.types().length + 1 }).subscribe({
      next: t  => { this.types.update(ts => [...ts, t]); this.appState.toast('وضعیت اضافه شد', 'success'); this.newCode = ''; this.newLabel = ''; },
      error: e => this.appState.toast(e.status === 409 ? 'کد تکراری است' : 'خطا در افزودن', 'error'),
    });
  }
}