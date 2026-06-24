import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentsApi } from '../../../core/services/api.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { formatShamsi, DISABILITY_SEVERITY_LABEL } from '../../../shared/utils/shamsi.util';

@Component({
  selector: 'maz-student-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  styles: [`
    .back-link { display:inline-flex;align-items:center;gap:6px;color:var(--maz-firouzeh-600);font-size:13px;font-weight:600;margin-bottom:20px;text-decoration:none; }
    .profile-header { background:linear-gradient(135deg,var(--maz-firouzeh-900),var(--maz-firouzeh-700));border-radius:var(--maz-radius-lg);padding:28px 32px;display:flex;align-items:center;gap:24px;margin-bottom:24px;color:#fff; }
    .avatar { width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:32px; }
    .full-name { font-size:22px;font-weight:900; }
    .meta { font-size:13px;color:var(--maz-firouzeh-200);margin-top:6px;display:flex;gap:16px;flex-wrap:wrap; }
    .grid2 { display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px; }
    @media(max-width:768px) { .grid2 { grid-template-columns:1fr; } }
    .section-title { font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px; }
    .info-row { display:flex;padding:10px 0;border-bottom:1px solid var(--maz-gray-100); }
    .ir-label { font-size:12px;font-weight:700;color:var(--maz-gray-500);width:155px;flex-shrink:0; }
    .ir-val   { font-size:13px;color:var(--maz-gray-800);font-weight:500; }
    .bool-yes { color:var(--maz-firouzeh-600);font-weight:700; }
    .tag { display:inline-block;font-size:11px;font-weight:700;background:var(--maz-firouzeh-100);color:var(--maz-firouzeh-800);padding:2px 8px;border-radius:6px;margin-left:4px; }
    .multi-tag { background:var(--maz-gold-100);color:var(--maz-gold-700); }
    .history-row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--maz-gray-100); }
    .hs-label { font-size:13px;font-weight:600; }
    .hs-date  { font-size:11px;color:var(--maz-gray-400); }
  `],
  template: `
    <a class="back-link" routerLink="/students">← بازگشت به لیست</a>
    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else if (d()) {
      <div class="profile-header">
        <div class="avatar">{{ d().gender === 'MALE' ? '👦' : '👧' }}</div>
        <div style="flex:1">
          <div class="full-name">{{ d().firstName }} {{ d().lastName }}</div>
          <div class="meta">
            <span>کد ملی: {{ d().nationalCode }}</span>
            <span>سن: {{ d().age ?? '—' }}</span>
            <span>{{ d().educationLevelLabel }} — {{ d().gradeLabel }}</span>
            <span>{{ d().centerName }}</span>
          </div>
        </div>
        <a class="maz-btn maz-btn--outline" style="color:#fff;border-color:rgba(255,255,255,.4)"
          [routerLink]="['/students', d().id, 'edit']">ویرایش</a>
      </div>

      <div class="grid2">
        <div class="maz-card">
          <div class="section-title">اطلاعات هویتی</div>
          <div class="info-row"><span class="ir-label">جنسیت</span><span class="ir-val">{{ d().gender === 'MALE' ? 'پسر' : 'دختر' }}</span></div>
          <div class="info-row"><span class="ir-label">تاریخ تولد</span><span class="ir-val">{{ d().birthShamsi }}</span></div>
          <div class="info-row"><span class="ir-label">آدرس</span><span class="ir-val">{{ d().address }}</span></div>
          <div class="info-row"><span class="ir-label">تلفن منزل</span><span class="ir-val">{{ d().homePhone }}</span></div>
          <div class="info-row"><span class="ir-label">وضعیت</span>
            <maz-status-badge [label]="d().isActive ? 'فعال' : 'غیرفعال'" [variant]="d().isActive ? 'active' : 'inactive'" />
          </div>
        </div>

        <div class="maz-card">
          <div class="section-title">ولی / قیم قانونی</div>
          <div class="info-row"><span class="ir-label">نام ولی</span><span class="ir-val">{{ d().guardianName }}</span></div>
          <div class="info-row"><span class="ir-label">کد ملی ولی</span><span class="ir-val">{{ d().guardianNationalCode }}</span></div>
          <div class="info-row"><span class="ir-label">تلفن ولی</span><span class="ir-val">{{ d().guardianPhone }}</span></div>
          <div class="info-row"><span class="ir-label">وضعیت جسمی ولی</span><span class="ir-val">{{ d().guardianPhysical }}</span></div>
          <div class="info-row"><span class="ir-label">نام مادر</span><span class="ir-val">{{ d().secondGuardianName }}</span></div>
          <div class="info-row"><span class="ir-label">تلفن مادر</span><span class="ir-val">{{ d().secondGuardianPhone }}</span></div>
          <div class="info-row"><span class="ir-label">وضعیت جسمی مادر</span><span class="ir-val">{{ d().secondGuardianPhysical }}</span></div>
        </div>

        <div class="maz-card">
          <div class="section-title">اطلاعات تحصیلی</div>
          <div class="info-row"><span class="ir-label">مقطع</span><span class="ir-val">{{ d().educationLevelLabel }}</span></div>
          <div class="info-row"><span class="ir-label">پایه</span><span class="ir-val">{{ d().gradeLabel }}</span></div>
          <div class="info-row"><span class="ir-label">رشته</span><span class="ir-val">{{ d().fieldOfStudyLabel }}</span></div>
          <div class="info-row"><span class="ir-label">مدرسه</span><span class="ir-val">{{ d().centerName }}</span></div>
          <div class="info-row"><span class="ir-label">ناحیه</span><span class="ir-val">{{ d().districtLabel }}</span></div>
          <div class="info-row"><span class="ir-label">نوع حضور</span><span class="ir-val">{{ d().attendanceLabel }}</span></div>
          <div class="info-row"><span class="ir-label">تاریخ ورود به استثنایی</span><span class="ir-val">{{ d().entryShamsi }}</span></div>
          @if (d().currentClassName) {
            <div class="info-row"><span class="ir-label">کلاس فعلی</span>
              <a [routerLink]="['/classes', d().currentClassId]" style="font-size:13px;font-weight:600;color:var(--maz-firouzeh-600)">{{ d().currentClassName }}</a>
            </div>
          }
        </div>

        <div class="maz-card">
          <div class="section-title">معلولیت و نیازهای ویژه</div>
          @if (d().isMultipleDisability) { <span class="tag multi-tag">چندمعلولیتی</span> }
          @for (dis of d().disabilities; track dis.id) {
            <div class="info-row">
              <span class="ir-label">{{ dis.label }}</span>
              <span class="ir-val">{{ dis.extra }}</span>
            </div>
          }
          @if (!d().disabilities.length) { <div class="maz-text-muted maz-text-sm" style="padding:8px 0">معلولیتی ثبت نشده</div> }
          <div style="margin-top:8px">
            <div class="info-row"><span class="ir-label">وضعیت جسمانی</span><span class="ir-val">{{ d().physicalStatusLabel }}</span></div>
            <div class="info-row"><span class="ir-label">نوع کتاب</span><span class="ir-val">{{ d().bookTypeLabel }}</span></div>
            <div class="info-row"><span class="ir-label">مشکل گفتاری</span><span class="ir-val">{{ d().speechDisorderLabel }}</span></div>
            <div class="info-row"><span class="ir-label">نیاز به کاردرمانی</span><span class="ir-val" [class.bool-yes]="d().needsOT">{{ d().needsOT ? 'بله' : 'خیر' }}</span></div>
            <div class="info-row"><span class="ir-label">نیاز به گفتاردرمانی</span><span class="ir-val" [class.bool-yes]="d().needsST">{{ d().needsST ? 'بله' : 'خیر' }}</span></div>
            <div class="info-row"><span class="ir-label">نیاز به فیزیوتراپی</span><span class="ir-val" [class.bool-yes]="d().needsPT">{{ d().needsPT ? 'بله' : 'خیر' }}</span></div>
          </div>
          @if (d().assistiveDeviceLabels.length) {
            <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
              @for (lbl of d().assistiveDeviceLabels; track lbl) { <span class="tag">{{ lbl }}</span> }
            </div>
          }
        </div>

        <div class="maz-card">
          <div class="section-title">موارد خاص و فعالیت‌ها</div>
          @if (d().isMartyrFamily)     { <div class="info-row"><span class="ir-label">شاهد و ایثارگر</span><span class="ir-val bool-yes">بله</span></div> }
          @if (d().isOrphan)           { <div class="info-row"><span class="ir-label">یتیم</span><span class="ir-val bool-yes">بله</span></div> }
          @if (d().isUnderWelfare)     { <div class="info-row"><span class="ir-label">تحت پوشش بهزیستی</span><span class="ir-val bool-yes">بله</span></div> }
          @if (d().isUnderRelief)      { <div class="info-row"><span class="ir-label">تحت پوشش کمیته امداد</span><span class="ir-val bool-yes">بله</span></div> }
          @if (d().hasNonParentGuardian) { <div class="info-row"><span class="ir-label">سرپرست غیر</span><span class="ir-val bool-yes">بله</span></div> }
          <div class="info-row"><span class="ir-label">فعالیت‌های تمایل</span>
            <span class="ir-val">
              @for (a of d().willingActivities; track a) { <span class="tag">{{ a }}</span> }
            </span>
          </div>
          @if (d().achievementsText) {
            <div class="info-row"><span class="ir-label">رتبه‌های کسب‌شده</span><span class="ir-val">{{ d().achievementsText }}</span></div>
          }
          @if (d().notes) {
            <div class="info-row"><span class="ir-label">توضیحات</span><span class="ir-val">{{ d().notes }}</span></div>
          }
        </div>

        <div class="maz-card">
          <div class="section-title">تاریخچه وضعیت</div>
          @for (h of d().statusHistory; track h.id) {
            <div class="history-row">
              <div>
                <div class="hs-label">{{ h.label }}</div>
                @if (h.note) { <div style="font-size:11px;color:var(--maz-gray-500)">{{ h.note }}</div> }
              </div>
              <div class="hs-date">{{ h.date }}</div>
            </div>
          }
          @if (!d().statusHistory.length) {
            <div class="maz-text-muted maz-text-sm">هیچ تغییر وضعیتی ثبت نشده</div>
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
  private _raw = signal<any>(null);

  // همه داده‌ها رو به یه شکل type-safe تبدیل می‌کنیم
  d = computed(() => {
    const s = this._raw();
    if (!s) return null!;
    const sevMap: Record<string, string> = { MILD: 'خفیف', MODERATE: 'متوسط', SEVERE: 'شدید' };
    return {
      id: s.id, nationalCode: s.nationalCode, firstName: s.firstName, lastName: s.lastName,
      gender: s.gender as string, age: s.age, isActive: s.isActive,

      birthShamsi: formatShamsi(s.birthYearShamsi, s.birthMonth, s.birthDay),
      address: s.address ?? '—', homePhone: s.homePhone ?? '—',

      guardianName: s.guardianName ?? '—', guardianNationalCode: s.guardianNationalCode ?? '—',
      guardianPhone: s.guardianPhone ?? '—', guardianPhysical: s.guardianPhysicalStatus?.label ?? 'سالم',
      secondGuardianName: s.secondGuardianName ?? '—', secondGuardianPhone: s.secondGuardianPhone ?? '—',
      secondGuardianPhysical: s.secondGuardianPhysicalStatus?.label ?? 'سالم',

      educationLevelLabel: s.educationLevel?.label ?? '—', gradeLabel: s.grade?.label ?? '—',
      fieldOfStudyLabel: s.fieldOfStudy?.label ?? '—', centerName: s.center?.name ?? '—',
      districtLabel: s.district?.label ?? '—',
      attendanceLabel: s.attendanceType === 'SCHOOL_PRESENCE' ? 'حضور در مدرسه' : 'کمیسیون خاص بند ۱۸',
      entryShamsi: formatShamsi(s.entryYear, s.entryMonth, s.entryDay),
      currentClassId: s.classAssignments?.[0]?.classRoom?.id,
      currentClassName: s.classAssignments?.[0]?.classRoom?.name,

      physicalStatusLabel: s.physicalStatus?.label ?? '—', bookTypeLabel: s.bookType?.label ?? '—',
      speechDisorderLabel: s.speechDisorder?.label ?? '—',
      needsOT: !!s.needsOccupationalTherapy, needsST: !!s.needsSpeechTherapy, needsPT: !!s.needsPhysiotherapy,
      isMultipleDisability: !!s.isMultipleDisability,
      disabilities: (s.disabilities ?? []).map((d: any) => ({
        id: d.id, label: d.disabilityType?.label ?? '—',
        extra: d.autismLevel ? `سطح ${d.autismLevel}` : (sevMap[d.severity] ?? ''),
      })),
      assistiveDeviceLabels: (s.assistiveDevices ?? []).map((x: any) => x.assistiveDevice?.label).filter(Boolean) as string[],

      isMartyrFamily: !!s.isMartyrFamily, isOrphan: !!s.isOrphan,
      isUnderWelfare: !!s.isUnderWelfare, isUnderRelief: !!s.isUnderRelief,
      hasNonParentGuardian: !!s.hasNonParentGuardian,
      willingActivities: [
        s.willingCultural && 'فرهنگی', s.willingArt && 'هنری',
        s.willingSports && 'ورزشی', s.willingQuran && 'قرآن و عترت',
      ].filter(Boolean) as string[],
      achievementsText: s.achievementsText, notes: s.notes,

      statusHistory: (s.studentStatusHistory ?? []).map((h: any) => ({
        id: h.id, label: h.statusType?.label ?? '—',
        date: h.effectiveDate ? new Date(h.effectiveDate).toLocaleDateString('fa-IR') : '—',
        note: h.note,
      })),
    };
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getOne(id).subscribe({
      next:  s => { this._raw.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
