import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentsApi } from '../../../core/services/api.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Student } from '../../../core/models';

@Component({
  selector: 'maz-student-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--maz-firouzeh-600); font-size: 13px; font-weight: 600; margin-bottom: 20px; text-decoration: none; }
    .profile-header {
      background: linear-gradient(135deg, var(--maz-firouzeh-900), var(--maz-firouzeh-700));
      border-radius: var(--maz-radius-lg); padding: 28px 32px;
      display: flex; align-items: center; gap: 24px; margin-bottom: 24px; color: #fff;
      .avatar { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.15);
        display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; }
      .full-name { font-size: 22px; font-weight: 900; }
      .meta { font-size: 13px; color: var(--maz-firouzeh-200); margin-top: 6px; display: flex; gap: 16px; flex-wrap: wrap; }
    }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid var(--maz-gray-100);
      .ir-label { font-size: 12px; font-weight: 700; color: var(--maz-gray-500); width: 120px; flex-shrink: 0; }
      .ir-val   { font-size: 13px; color: var(--maz-gray-800); font-weight: 500; }
    }
    .enroll-item { padding: 10px 0; border-bottom: 1px solid var(--maz-gray-100);
      .e-center { font-size: 13px; font-weight: 700; }
      .e-meta   { font-size: 11px; color: var(--maz-gray-400); margin-top: 3px; }
    }
  `],
  template: `
    <a class="back-link" routerLink="/students">← بازگشت به لیست</a>

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else if (student()) {
      <div class="profile-header">
        <div class="avatar">{{ student()!.firstName[0] }}</div>
        <div>
          <div class="full-name">{{ student()!.firstName }} {{ student()!.lastName }}</div>
          <div class="meta">
            <span>کد ملی: {{ student()!.nationalCode }}</span>
            <span>{{ student()!.gender === 'MALE' ? 'مرد' : 'زن' }}</span>
          </div>
        </div>
        <a class="maz-btn maz-btn--outline" style="color:#fff;border-color:rgba(255,255,255,.4)"
          [routerLink]="['/students', student()!.id, 'edit']">ویرایش</a>
      </div>

      <div class="detail-grid">
        <div class="maz-card">
          <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">اطلاعات پایه</div>
          <div class="info-row"><span class="ir-label">نام والد</span><span class="ir-val">{{ student()!.parentName ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">تلفن والد</span><span class="ir-val">{{ student()!.parentPhone ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">تاریخ تولد</span><span class="ir-val">{{ student()!.birthDate ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">آدرس</span><span class="ir-val">{{ student()!.address ?? '—' }}</span></div>
          <div class="info-row"><span class="ir-label">وضعیت</span>
            <maz-status-badge [label]="student()!.isActive ? 'فعال' : 'غیرفعال'" [variant]="student()!.isActive ? 'active' : 'inactive'" />
          </div>
        </div>

        <div class="maz-card">
          <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">ثبت‌نام‌ها</div>
          @for (e of student()!.enrollments; track e.id) {
            <div class="enroll-item">
              <div class="e-center">{{ e.center?.name }}</div>
              <div class="e-meta">پایه {{ e.grade }} · {{ e.academicYear?.label }} · {{ e.center?.city }}</div>
            </div>
          }
          @if (!student()!.enrollments?.length) {
            <div class="maz-text-muted" style="text-align:center;padding:20px">ثبت‌نامی یافت نشد</div>
          }
        </div>
      </div>
    }
  `,
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api   = inject(StudentsApi);

  loading = signal(true);
  student = signal<Student | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getOne(id).subscribe({
      next:  s => { this.student.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
