import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CentersApi } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Center, CENTER_TYPE_LABEL } from '../../../core/models';

@Component({
  selector: 'maz-center-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--maz-firouzeh-600); font-size: 13px; font-weight: 600; margin-bottom: 20px; text-decoration: none; }
    .profile-header {
      background: linear-gradient(135deg, var(--maz-firouzeh-900), var(--maz-firouzeh-700));
      border-radius: var(--maz-radius-lg); padding: 28px 32px;
      display: flex; align-items: center; gap: 24px; margin-bottom: 24px; color: #fff;
      .avatar { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.15);
        display: flex; align-items: center; justify-content: center; font-size: 32px; }
      .full-name { font-size: 22px; font-weight: 900; }
      .meta { font-size: 13px; color: var(--maz-firouzeh-200); margin-top: 6px; display: flex; gap: 16px; flex-wrap: wrap; }
    }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid var(--maz-gray-100);
      .ir-label { font-size: 12px; font-weight: 700; color: var(--maz-gray-500); width: 120px; flex-shrink: 0; }
      .ir-val   { font-size: 13px; color: var(--maz-gray-800); font-weight: 500; }
    }
    .stat-box { text-align: center; padding: 16px;
      .stat-num { font-size: 28px; font-weight: 900; color: var(--maz-firouzeh-700); }
      .stat-lbl { font-size: 12px; color: var(--maz-gray-500); margin-top: 4px; }
    }
  `],
  template: `
    <a class="back-link" routerLink="/centers">← بازگشت به لیست</a>

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else if (center()) {
      <div class="profile-header">
        <div class="avatar">🏫</div>
        <div style="flex:1">
          <div class="full-name">{{ center()!.name }}</div>
          <div class="meta">
            <span>کد: {{ center()!.code }}</span>
            <span>{{ typeLabel(center()!.type) }}</span>
            <span>{{ center()!.province }} — {{ center()!.city }}</span>
          </div>
        </div>
        @if (auth.isSuperuser()) {
          <a class="maz-btn maz-btn--outline" style="color:#fff;border-color:rgba(255,255,255,.4)"
            [routerLink]="['/centers', center()!.id, 'edit']">ویرایش</a>
        }
      </div>

      <div class="detail-grid">
        <div class="maz-card">
          <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">اطلاعات مرکز</div>
          <div class="info-row"><span class="ir-label">تلفن</span><span class="ir-val">{{ center()!.phone ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">آدرس</span><span class="ir-val">{{ center()!.address ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">وضعیت</span>
            <maz-status-badge [label]="center()!.isActive ? 'فعال' : 'غیرفعال'" [variant]="center()!.isActive ? 'active' : 'inactive'" />
          </div>
          <div class="info-row"><span class="ir-label">تاریخ ثبت</span><span class="ir-val">{{ center()!.createdAt | date:'yyyy/MM/dd' }}</span></div>
        </div>

        <div class="maz-card" style="display:flex;gap:0">
          <div class="stat-box" style="flex:1;border-left:1px solid var(--maz-gray-100)">
            <div class="stat-num">{{ center()!._count?.userAssignments ?? 0 }}</div>
            <div class="stat-lbl">پرسنل</div>
          </div>
          <div class="stat-box" style="flex:1">
            <div class="stat-num">{{ center()!._count?.studentEnrollments ?? 0 }}</div>
            <div class="stat-lbl">دانش‌آموز</div>
          </div>
        </div>
      </div>
    }
  `,
})
export class CenterDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api   = inject(CentersApi);
  readonly auth = inject(AuthService);

  loading = signal(true);
  center  = signal<Center | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getOne(id).subscribe({
      next:  c => { this.center.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(t: string) { return CENTER_TYPE_LABEL[t as keyof typeof CENTER_TYPE_LABEL] ?? t; }
}
