// src/app/features/users/user-detail/user-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersApi, StatusApi, AcademicYearsApi, CentersApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthService }     from '../../../core/auth/auth.service';
import { StatusBadgeComponent, personnelStatusVariant } from '../../../shared/components/status-badge/status-badge.component';
import { User, StatusType, Center } from '../../../core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'maz-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusBadgeComponent],
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--maz-firouzeh-600); font-size: 13px; font-weight: 600; margin-bottom: 20px; cursor: pointer; text-decoration: none; &:hover { color: var(--maz-firouzeh-800); } }

    .profile-header {
      background: linear-gradient(135deg, var(--maz-firouzeh-900), var(--maz-firouzeh-700));
      border-radius: var(--maz-radius-lg); padding: 28px 32px;
      display: flex; align-items: center; gap: 24px; margin-bottom: 24px; color: #fff;

      .avatar {
        width: 72px; height: 72px; border-radius: 50%;
        background: rgba(255,255,255,.15); border: 3px solid rgba(255,255,255,.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; font-weight: 900; flex-shrink: 0;
      }
      .info { flex: 1; }
      .full-name { font-size: 22px; font-weight: 900; }
      .meta { font-size: 13px; color: var(--maz-firouzeh-200); margin-top: 6px; display: flex; gap: 16px; flex-wrap: wrap; }
    }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;
    }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }

    .info-row {
      display: flex; align-items: center; padding: 10px 0;
      border-bottom: 1px solid var(--maz-gray-100);
      &:last-child { border-bottom: none; }
      .ir-label { font-size: 12px; font-weight: 700; color: var(--maz-gray-500); width: 120px; flex-shrink: 0; }
      .ir-val   { font-size: 13px; color: var(--maz-gray-800); font-weight: 500; }
    }

    .history-item {
      display: flex; gap: 14px; padding: 12px 0;
      border-bottom: 1px solid var(--maz-gray-100);
      &:last-child { border-bottom: none; }

      .timeline-dot {
        width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
        background: var(--maz-firouzeh-500); border: 2px solid var(--maz-firouzeh-200);
      }
      .h-info {
        flex: 1;
        .h-status { font-size: 13px; font-weight: 700; color: var(--maz-gray-800); }
        .h-dates  { font-size: 11px; color: var(--maz-gray-400); margin-top: 3px; }
        .h-note   { font-size: 12px; color: var(--maz-gray-500); margin-top: 4px; background: var(--maz-gray-50); border-radius: 6px; padding: 4px 8px; }
      }
    }

    .assign-item {
      padding: 10px 0; border-bottom: 1px solid var(--maz-gray-100);
      &:last-child { border-bottom: none; }
      .a-center { font-size: 13px; font-weight: 700; color: var(--maz-gray-800); }
      .a-meta   { font-size: 11px; color: var(--maz-gray-400); margin-top: 3px; display: flex; gap: 12px; }
    }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { background: #fff; border-radius: var(--maz-radius-lg); width: 100%; max-width: 460px; box-shadow: var(--maz-shadow-lg); }
    .modal-head { padding: 20px 24px 16px; border-bottom: 1px solid var(--maz-border); display: flex; align-items: center; justify-content: space-between; font-size: 15px; font-weight: 800; color: var(--maz-firouzeh-900); }
    .modal-body { padding: 20px 24px; }
    .modal-foot { padding: 16px 24px; border-top: 1px solid var(--maz-border); display: flex; gap: 10px; justify-content: flex-end; }
  `],
  template: `
    <a class="back-link" routerLink="/users">← بازگشت به لیست پرسنل</a>

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else if (user()) {

      <!-- Profile header -->
      <div class="profile-header">
        <div class="avatar">{{ user()!.firstName[0] }}</div>
        <div class="info">
          <div class="full-name">{{ user()!.firstName }} {{ user()!.lastName }}</div>
          <div class="meta">
            <span>کد ملی: {{ user()!.nationalCode }}</span>
            <span>{{ userTypeLabel(user()!.userType) }}</span>
            <span>{{ user()!.gender === 'MALE' ? 'مرد' : 'زن' }}</span>
          </div>
        </div>
        @if (auth.isSuperuser()) {
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="maz-btn maz-btn--outline" style="color:#fff;border-color:rgba(255,255,255,.4)" (click)="showStatusModal = true">
              + ثبت وضعیت
            </button>
            <button class="maz-btn maz-btn--outline" style="color:#fff;border-color:rgba(255,255,255,.4)" (click)="showTransferModal = true">
              🔄 نقل‌وانتقال
            </button>
          </div>
        }
      </div>

      <div class="detail-grid">

        <!-- اطلاعات پایه -->
        <div class="maz-card">
          <div class="maz-flex-between maz-gap-8" style="margin-bottom:16px">
            <span style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900)">اطلاعات پایه</span>
            <maz-status-badge [label]="user()!.isActive ? 'فعال' : 'غیرفعال'" [variant]="user()!.isActive ? 'active' : 'inactive'" />
          </div>
          <div class="info-row"><span class="ir-label">نام</span><span class="ir-val">{{ user()!.firstName }} {{ user()!.lastName }}</span></div>
          <div class="info-row"><span class="ir-label">کد ملی</span><span class="ir-val">{{ user()!.nationalCode }}</span></div>
          <div class="info-row"><span class="ir-label">جنسیت</span><span class="ir-val">{{ user()!.gender === 'MALE' ? 'مرد' : 'زن' }}</span></div>
          <div class="info-row"><span class="ir-label">تلفن</span><span class="ir-val">{{ user()!.phone ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">ایمیل</span><span class="ir-val">{{ user()!.email ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">لاگین</span><span class="ir-val">{{ user()!.canLogin ? '✅ دارد' : '❌ ندارد' }}</span></div>
          <div class="info-row"><span class="ir-label">تاریخ ثبت</span><span class="ir-val">{{ user()!.createdAt | date:'yyyy/MM/dd' }}</span></div>
        </div>

        <!-- تخصیص مراکز -->
        <div class="maz-card">
          <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">تخصیص مراکز</div>
          @for (a of user()!.centerAssignments; track a.id) {
            <div class="assign-item">
              <div class="a-center">{{ a.center?.name }}</div>
              <div class="a-meta">
                <span>{{ a.center?.city }}</span>
                <span>{{ a.academicYear?.label }}</span>
                <span>از {{ a.assignedAt | date:'yyyy/MM/dd' }}</span>
                @if (a.revokedAt) { <span style="color:var(--maz-danger)">تا {{ a.revokedAt | date:'yyyy/MM/dd' }}</span> }
                @else { <span class="maz-badge maz-badge--active" style="font-size:10px;padding:1px 6px">فعال</span> }
              </div>
              @if (a.note) { <div style="font-size:11px;color:var(--maz-gray-400);margin-top:3px">{{ a.note }}</div> }
            </div>
          }
          @if (!user()!.centerAssignments?.length) {
            <div class="maz-text-muted" style="text-align:center;padding:20px">تخصیصی ثبت نشده</div>
          }
        </div>

      </div>

      <!-- تاریخچه وضعیت -->
      <div class="maz-card">
        <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">تاریخچه وضعیت پرسنلی</div>
        @for (h of user()!.personnelStatusHistory; track h.id) {
          <div class="history-item">
            <div class="timeline-dot"></div>
            <div class="h-info">
              <div class="h-status">
                <maz-status-badge
                  [label]="h.statusType?.label ?? ''"
                  [variant]="statusVariant(h.statusType?.code ?? '')"
                />
              </div>
              <div class="h-dates">
                از {{ h.effectiveDate | date:'yyyy/MM/dd' }}
                @if (h.endDate) { تا {{ h.endDate | date:'yyyy/MM/dd' }} }
                @else { <span style="color:var(--maz-success)">— جاری</span> }
                · {{ h.academicYear?.label }}
              </div>
              @if (h.note) { <div class="h-note">{{ h.note }}</div> }
            </div>
          </div>
        }
        @if (!user()!.personnelStatusHistory?.length) {
          <div class="maz-text-muted" style="text-align:center;padding:24px">وضعیتی ثبت نشده</div>
        }
      </div>

    }

    <!-- Modal: ثبت وضعیت -->
    @if (showStatusModal) {
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-head">
            ثبت تغییر وضعیت پرسنلی
            <button style="border:none;background:none;cursor:pointer;font-size:20px" (click)="showStatusModal=false">×</button>
          </div>
          <div class="modal-body">
            <div class="maz-form-group">
              <label class="maz-label">نوع وضعیت</label>
              <select class="maz-select" [(ngModel)]="statusForm.statusTypeId">
                <option value="">انتخاب کنید...</option>
                @for (s of statusTypes(); track s.id) {
                  <option [value]="s.id">{{ s.label }}</option>
                }
              </select>
            </div>
            <div class="maz-form-group">
              <label class="maz-label">تاریخ اجرا</label>
              <input class="maz-input" type="date" [(ngModel)]="statusForm.effectiveDate" />
            </div>
            <div class="maz-form-group">
              <label class="maz-label">توضیح</label>
              <textarea class="maz-input" rows="3" style="resize:none" [(ngModel)]="statusForm.note"></textarea>
            </div>
          </div>
          <div class="modal-foot">
            <button class="maz-btn maz-btn--ghost" (click)="showStatusModal=false">انصراف</button>
            <button class="maz-btn maz-btn--primary" (click)="submitStatus()">ذخیره</button>
          </div>
        </div>
      </div>
    }

    <!-- Modal: نقل‌وانتقال -->
    @if (showTransferModal) {
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-head">
            نقل‌وانتقال به مرکز دیگر
            <button style="border:none;background:none;cursor:pointer;font-size:20px" (click)="showTransferModal=false">×</button>
          </div>
          <div class="modal-body">
            <div class="maz-form-group">
              <label class="maz-label">مرکز مبدأ <span style="color:var(--maz-gray-400);font-weight:400">(اختیاری)</span></label>
              <select class="maz-select" [(ngModel)]="transferForm.fromCenterId" name="fromCenterId">
                <option [ngValue]="0">— تشخیص خودکار —</option>
                @for (a of activeAssignments(); track a.id) {
                  <option [ngValue]="a.centerId">{{ a.center?.name }}</option>
                }
              </select>
            </div>
            <div class="maz-form-group">
              <label class="maz-label">مرکز مقصد</label>
              <select class="maz-select" [(ngModel)]="transferForm.toCenterId">
                <option value="">انتخاب کنید...</option>
                @for (c of centers(); track c.id) {
                  <option [value]="c.id">{{ c.name }} — {{ c.city }}</option>
                }
              </select>
            </div>
            <div class="maz-form-group">
              <label class="maz-label">توضیح</label>
              <input class="maz-input" [(ngModel)]="transferForm.note" placeholder="دلیل نقل‌وانتقال" />
            </div>
          </div>
          <div class="modal-foot">
            <button class="maz-btn maz-btn--ghost" (click)="showTransferModal=false">انصراف</button>
            <button class="maz-btn maz-btn--primary" (click)="submitTransfer()">ثبت انتقال</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UserDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private usersApi   = inject(UsersApi);
  private statusApi  = inject(StatusApi);
  private centersApi = inject(CentersApi);
  readonly appState  = inject(AppStateService);
  readonly auth      = inject(AuthService);

  loading = signal(true);
  user    = signal<User | null>(null);
  statusTypes = signal<StatusType[]>([]);
  centers     = signal<Center[]>([]);

  showStatusModal   = false;
  showTransferModal = false;

  statusForm = { statusTypeId: '', effectiveDate: '', note: '' };
  transferForm = { fromCenterId: 0, toCenterId: 0, note: '' };

  activeAssignments = () =>
    (this.user()?.centerAssignments ?? []).filter(a => !a.revokedAt);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      user:    this.usersApi.getOne(id),
      types:   this.statusApi.getTypes('PERSONNEL'),
      centers: this.centersApi.list({ page: 1, pageSize: 200 }),
    }).subscribe({
      next: ({ user, types, centers }) => {
        this.user.set(user);
        this.statusTypes.set(types);
        this.centers.set(centers.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitStatus() {
    const u = this.user();
    const yearId = this.appState.activeYearId();
    if (!u || !this.statusForm.statusTypeId || !this.statusForm.effectiveDate || !yearId) return;

    this.statusApi.recordPersonnel({
      entityId:       u.id,
      statusTypeId:   Number(this.statusForm.statusTypeId),
      academicYearId: yearId,
      effectiveDate:  this.statusForm.effectiveDate,
      note:           this.statusForm.note,
    }).subscribe({
      next: () => {
        this.appState.toast('وضعیت با موفقیت ثبت شد', 'success');
        this.showStatusModal = false;
        this.reload();
      },
      error: () => this.appState.toast('خطا در ثبت وضعیت', 'error'),
    });
  }

  submitTransfer() {
    const u = this.user();
    const yearId = this.appState.activeYearId();
    if (!u || !this.transferForm.toCenterId || !yearId) return;

    this.usersApi.transfer(u.id, {
      fromCenterId:   this.transferForm.fromCenterId ? Number(this.transferForm.fromCenterId) : undefined,
      toCenterId:     Number(this.transferForm.toCenterId),
      academicYearId: yearId,
      note:           this.transferForm.note,
    }).subscribe({
      next: () => {
        this.appState.toast('انتقال با موفقیت ثبت شد', 'success');
        this.showTransferModal = false;
        this.reload();
      },
      error: () => this.appState.toast('خطا در ثبت انتقال', 'error'),
    });
  }

  reload() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.usersApi.getOne(id).subscribe(u => this.user.set(u));
  }

  userTypeLabel(t: string) {
    const m: Record<string, string> = { SUPERUSER: 'سوپریوزر', CENTER_MANAGER: 'مدیر مرکز', TEACHER: 'معلم', STAFF: 'کارمند' };
    return m[t] ?? t;
  }

  statusVariant = personnelStatusVariant;
}