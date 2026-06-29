import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CentersApi } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Center } from '../../../core/models';

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
      .ir-label { font-size: 12px; font-weight: 700; color: var(--maz-gray-500); width: 140px; flex-shrink: 0; }
      .ir-val   { font-size: 13px; color: var(--maz-gray-800); font-weight: 500; }
    }
    .stat-box { text-align: center; padding: 16px;
      .stat-num { font-size: 28px; font-weight: 900; color: var(--maz-firouzeh-700); }
      .stat-lbl { font-size: 12px; color: var(--maz-gray-500); margin-top: 4px; }
    }
    .card-title { font-size: 14px; font-weight: 800; color: var(--maz-firouzeh-900); margin-bottom: 16px; }
    .staff-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0;
      border-bottom: 1px solid var(--maz-gray-100); font-size: 13px;
      &:last-child { border-bottom: none; }
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
            <span>کد: {{ center()!.organizationCode  }}</span>
            <span>{{ center()!.centerType?.label ?? '—' }}</span>
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
          <div class="card-title">اطلاعات مرکز</div>
          <div class="info-row"><span class="ir-label">ناحیه آموزشی</span><span class="ir-val">{{ center()!.district?.label ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">تلفن</span><span class="ir-val">{{ center()!.phone ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">آدرس</span><span class="ir-val">{{ center()!.address ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">سال تأسیس</span><span class="ir-val">{{ center()!.establishedYear ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">وضعیت</span>
            <maz-status-badge [label]="center()!.isActive ? 'فعال' : 'غیرفعال'" [variant]="center()!.isActive ? 'active' : 'inactive'" />
          </div>
          <div class="info-row"><span class="ir-label">تاریخ ثبت</span><span class="ir-val">{{ center()!.createdAt | date:'yyyy/MM/dd' }}</span></div>
        </div>

        <div class="maz-card" style="display:flex;gap:0;padding:0">
          <div class="stat-box" style="flex:1;border-left:1px solid var(--maz-gray-100)">
            <div class="stat-num">{{ center()!._count?.userAssignments ?? 0 }}</div>
            <div class="stat-lbl">پرسنل</div>
          </div>
          <div class="stat-box" style="flex:1">
            <div class="stat-num">{{ center()!._count?.studentEnrollments ?? 0 }}</div>
            <div class="stat-lbl">دانش‌آموز</div>
          </div>
        </div>

        <div class="maz-card">
          <div class="card-title">کدهای واحد سازمانی</div>
          <div class="info-row"><span class="ir-label">پیش‌دبستانی</span><span class="ir-val">{{ center()!.preSchoolCode ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">ابتدایی</span><span class="ir-val">{{ center()!.primaryCode ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">متوسطه اول</span><span class="ir-val">{{ center()!.firstMiddleCode ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">متوسطه اول پیش‌حرفه‌ای</span><span class="ir-val">{{ center()!.firstMiddleVocationalCode ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">متوسطه دوم کاردانش خاص</span><span class="ir-val">{{ center()!.secondMiddleSpecialVocationalCode ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">متوسطه دوم</span><span class="ir-val">{{ center()!.secondMiddleCode ?? '—' }}</span></div>
        </div>

        <div class="maz-card">
          <div class="card-title">اطلاعات بانکی</div>
          <div class="info-row"><span class="ir-label">شماره حساب</span><span class="ir-val">{{ center()!.bankAccountNumber ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">شماره شبا</span><span class="ir-val">{{ center()!.shabaNumber ?? '—' }}</span></div>
        </div>

        <div class="maz-card" style="grid-column: 1 / -1">
          <div class="card-title">مدیر و پرسنل مرکز</div>
          @if (manager(); as m) {
            <div class="info-row">
              <span class="ir-label">مدیر مرکز</span>
              <span class="ir-val">{{ m.user?.firstName }} {{ m.user?.lastName }} — {{ m.user?.phone ?? '—' }}</span>
            </div>
          } @else {
            <div class="info-row"><span class="ir-label">مدیر مرکز</span><span class="ir-val maz-text-muted">— بدون مدیر —</span></div>
          }
          @for (a of staffList(); track a.id) {
            <div class="staff-row">
              <span>{{ a.user?.firstName }} {{ a.user?.lastName }}</span>
              <span class="maz-text-muted">{{ userTypeLabel(a.user?.userType) }}</span>
              <span class="maz-text-muted">{{ a.user?.phone ?? '—' }}</span>
            </div>
          }
          @if (!staffList().length) {
            <div class="maz-text-muted" style="font-size:13px;padding:10px 0">پرسنلی برای این مرکز ثبت نشده</div>
          }
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

  manager = computed(() =>
    (this.center()?.userAssignments ?? []).find(
      a => a.isPrimary && a.user?.userType === 'CENTER_MANAGER',
    ) ?? null,
  );
  staffList = computed(() =>
    (this.center()?.userAssignments ?? []).filter(
      a => !(a.isPrimary && a.user?.userType === 'CENTER_MANAGER'),
    ),
  );

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getOne(id).subscribe({
      next:  c => { this.center.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  userTypeLabel(t?: string) {
    const m: Record<string, string> = {
      SUPERUSER: 'سوپریوزر', CENTER_MANAGER: 'مدیر مرکز',
      TEACHER: 'معلم', STAFF: 'کارمند', STUDENT: 'دانش‌آموز',
    };
    return t ? (m[t] ?? t) : '—';
  }
}
