import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { StudentsApi, LookupsApi, CentersApi, GradesApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { ShamsiDateInputComponent } from '../../../shared/components/shamsi-date-input/shamsi-date-input.component';
import type { ShamsiDate } from '../../../shared/components/shamsi-date-input/shamsi-date-input.component';
import { LookupGroups, Center } from '../../../core/models';

@Component({
  selector: 'maz-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormFieldComponent, ShamsiDateInputComponent],
  styles: [`
    .form-card { max-width: 860px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-grid--3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 16px; }
    @media (max-width: 760px) { .form-grid, .form-grid--3 { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 800; color: var(--maz-firouzeh-900);
      margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--maz-border); }
    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .checkbox-row label { font-size: 13px; color: var(--maz-gray-700); cursor: pointer; }
    .disability-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end;
      padding: 12px; background: var(--maz-gray-50); border-radius: var(--maz-radius-md); margin-bottom: 10px; }
    @media (max-width: 760px) { .disability-row { grid-template-columns: 1fr; } }
    .remove-btn { border: none; background: var(--maz-danger); color: #fff; border-radius: 8px;
      width: 34px; height: 34px; cursor: pointer; font-size: 16px; }
    .add-btn { border: 1px dashed var(--maz-firouzeh-300); background: var(--maz-firouzeh-50);
      color: var(--maz-firouzeh-700); border-radius: var(--maz-radius-md);
      padding: 10px; width: 100%; font-size: 13px; font-weight: 700; cursor: pointer; }
    .multi-tag { display: inline-block; font-size: 11px; font-weight: 700; color: var(--maz-gold-600);
      background: var(--maz-gold-100); padding: 2px 8px; border-radius: 6px; margin-bottom: 10px; }
    .devices-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .device-chip { padding: 6px 12px; border: 1.5px solid var(--maz-border); border-radius: 20px;
      cursor: pointer; font-size: 12px; }
    .device-chip.selected { border-color: var(--maz-firouzeh-500); background: var(--maz-firouzeh-50);
      color: var(--maz-firouzeh-800); font-weight: 700; }
  `],
  template: `
    <a class="maz-btn maz-btn--ghost maz-btn--sm" routerLink="/students" style="margin-bottom:20px;display:inline-flex">← بازگشت</a>
    <div class="maz-page-header">
      <div class="maz-page-header__title">{{ isEdit() ? 'ویرایش دانش‌آموز' : 'افزودن دانش‌آموز' }}</div>
    </div>

    <div class="maz-card form-card">
      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- هویتی -->
        <div class="section">
          <div class="section-title">اطلاعات هویتی</div>
          <div class="form-grid">
            <maz-form-field label="نام" [required]="true" [control]="f['firstName']"><input class="maz-input" formControlName="firstName" /></maz-form-field>
            <maz-form-field label="نام خانوادگی" [required]="true" [control]="f['lastName']"><input class="maz-input" formControlName="lastName" /></maz-form-field>
            <maz-form-field label="کد ملی" [required]="true" [control]="f['nationalCode']"><input class="maz-input" formControlName="nationalCode" maxlength="10" /></maz-form-field>
            <maz-form-field label="جنسیت" [required]="true" [control]="f['gender']">
              <select class="maz-select" formControlName="gender"><option value="MALE">پسر</option><option value="FEMALE">دختر</option></select>
            </maz-form-field>
            <maz-form-field label="آدرس" [control]="f['address']"><input class="maz-input" formControlName="address" /></maz-form-field>
            <maz-form-field label="تلفن منزل" [control]="f['homePhone']"><input class="maz-input" formControlName="homePhone" /></maz-form-field>
          </div>
          <maz-form-field label="تاریخ تولد (شمسی)">
            <maz-shamsi-date-input [initialValue]="birthDate()" (dateChange)="onBirthDateChange($event)"></maz-shamsi-date-input>
          </maz-form-field>
        </div>

        <!-- ولی قانونی -->
        <div class="section">
          <div class="section-title">ولی / قیم قانونی (پدر یا قیم)</div>
          <div class="form-grid">
            <maz-form-field label="نام ولی" [control]="f['guardianName']"><input class="maz-input" formControlName="guardianName" /></maz-form-field>
            <maz-form-field label="کد ملی ولی" [control]="f['guardianNationalCode']"><input class="maz-input" formControlName="guardianNationalCode" maxlength="10" /></maz-form-field>
            <maz-form-field label="تلفن ولی" [control]="f['guardianPhone']"><input class="maz-input" formControlName="guardianPhone" /></maz-form-field>
            <maz-form-field label="وضعیت جسمی ولی" [control]="f['guardianPhysicalStatusId']">
              <select class="maz-select" formControlName="guardianPhysicalStatusId">
                <option [value]="null">سالم</option>
                @for (o of lookups()['DISABILITY_TYPE']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
          </div>
        </div>

        <!-- ولی دوم -->
        <div class="section">
          <div class="section-title">ولی دوم (مادر)</div>
          <div class="form-grid">
            <maz-form-field label="نام مادر" [control]="f['secondGuardianName']"><input class="maz-input" formControlName="secondGuardianName" /></maz-form-field>
            <maz-form-field label="کد ملی مادر" [control]="f['secondGuardianNationalCode']"><input class="maz-input" formControlName="secondGuardianNationalCode" maxlength="10" /></maz-form-field>
            <maz-form-field label="تلفن مادر" [control]="f['secondGuardianPhone']"><input class="maz-input" formControlName="secondGuardianPhone" /></maz-form-field>
            <maz-form-field label="وضعیت جسمی مادر" [control]="f['secondGuardianPhysicalStatusId']">
              <select class="maz-select" formControlName="secondGuardianPhysicalStatusId">
                <option [value]="null">سالم</option>
                @for (o of lookups()['DISABILITY_TYPE']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
          </div>
        </div>

        <!-- تحصیلی -->
        <div class="section">
          <div class="section-title">اطلاعات تحصیلی</div>
          <div class="form-grid">
            <maz-form-field label="مقطع تحصیلی" [control]="f['educationLevelId']">
              <select class="maz-select" formControlName="educationLevelId" (change)="onLevelChange()">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['EDUCATION_LEVEL']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="پایه تحصیلی" [control]="f['gradeId']">
              <select class="maz-select" formControlName="gradeId">
                <option [value]="null">— ابتدا مقطع انتخاب کنید —</option>
                @for (g of filteredGrades(); track g.id) { <option [value]="g.id">{{ g.label }}</option> }
              </select>
            </maz-form-field>
            @if (showFieldOfStudy()) {
              <maz-form-field label="رشته تحصیلی" [control]="f['fieldOfStudyId']">
                <select class="maz-select" formControlName="fieldOfStudyId">
                  <option [value]="null">— انتخاب کنید —</option>
                  @for (o of lookups()['FIELD_OF_STUDY']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
                </select>
              </maz-form-field>
            }
            <maz-form-field label="نوع حضور" [control]="f['attendanceType']">
              <select class="maz-select" formControlName="attendanceType">
                <option value="SCHOOL_PRESENCE">حضور در مدرسه</option>
                <option value="SPECIAL_COMMISSION_18">کمیسیون خاص بند ۱۸</option>
              </select>
            </maz-form-field>
            <maz-form-field label="نام مدرسه" [control]="f['centerId']" hint="اگر خالی بماند از مرکز شما تنظیم می‌شود">
              @if (auth.isSuperuser()) {
                <select class="maz-select" formControlName="centerId">
                  <option [value]="null">— انتخاب کنید —</option>
                  @for (c of centers(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
                </select>
              } @else {
                <input class="maz-input" [value]="ownCenterName()" disabled />
              }
            </maz-form-field>
            <maz-form-field label="ناحیه" [control]="f['districtId']" hint="اگر خالی بماند از ناحیه مرکز تنظیم می‌شود">
              <select class="maz-select" formControlName="districtId">
                <option [value]="null">— تشخیص خودکار —</option>
                @for (o of lookups()['DISTRICT']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
          </div>
          <maz-form-field label="تاریخ ورود به مدرسه استثنایی (شمسی)">
            <maz-shamsi-date-input [initialValue]="entryDate()" (dateChange)="onEntryDateChange($event)"></maz-shamsi-date-input>
          </maz-form-field>
        </div>

        <!-- معلولیت -->
        <div class="section">
          <div class="section-title">معلولیت و نیازهای ویژه</div>
          <div class="form-grid">
            <maz-form-field label="وضعیت جسمانی" [control]="f['physicalStatusId']">
              <select class="maz-select" formControlName="physicalStatusId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['PHYSICAL_STATUS']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="نوع کتاب" [control]="f['bookTypeId']">
              <select class="maz-select" formControlName="bookTypeId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['BOOK_TYPE']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="مشکل گفتاری" [control]="f['speechDisorderId']">
              <select class="maz-select" formControlName="speechDisorderId">
                <option [value]="null">— ندارد —</option>
                @for (o of lookups()['SPEECH_DISORDER']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
          </div>
          <div class="form-grid--3" style="margin-bottom:12px">
            <div class="checkbox-row"><input type="checkbox" id="occ" formControlName="needsOccupationalTherapy" /><label for="occ">نیازمند کاردرمانی</label></div>
            <div class="checkbox-row"><input type="checkbox" id="spe" formControlName="needsSpeechTherapy" /><label for="spe">نیازمند گفتاردرمانی</label></div>
            <div class="checkbox-row"><input type="checkbox" id="physio" formControlName="needsPhysiotherapy" /><label for="physio">نیازمند فیزیوتراپی</label></div>
          </div>

          @if (disabilities.length > 1) { <span class="multi-tag">چندمعلولیتی</span> }
          @for (row of disabilities.controls; track $index; let i = $index) {
            <div class="disability-row" [formGroup]="asGroup(row)">
              <maz-form-field label="نوع معلولیت">
                <select class="maz-select" formControlName="disabilityTypeId">
                  <option [value]="null">— انتخاب کنید —</option>
                  @for (o of lookups()['DISABILITY_TYPE']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
                </select>
              </maz-form-field>
              @if (isAutism(row.get('disabilityTypeId')?.value)) {
                <maz-form-field label="سطح اتیسم">
                  <select class="maz-select" formControlName="autismLevel">
                    <option [value]="null">—</option><option [value]="1">سطح ۱</option><option [value]="2">سطح ۲</option><option [value]="3">سطح ۳</option>
                  </select>
                </maz-form-field>
              } @else {
                <maz-form-field label="شدت">
                  <select class="maz-select" formControlName="severity">
                    <option [value]="null">—</option><option value="MILD">خفیف</option><option value="MODERATE">متوسط</option><option value="SEVERE">شدید</option>
                  </select>
                </maz-form-field>
              }
              <div></div>
              <button type="button" class="remove-btn" (click)="removeDisability(i)">×</button>
            </div>
          }
          <button type="button" class="add-btn" (click)="addDisability()">+ افزودن معلولیت</button>

          <div style="margin-top:16px">
            <div style="font-size:12px;color:var(--maz-gray-500);margin-bottom:4px">وسایل کمکی مورد استفاده</div>
            <div class="devices-grid">
              @for (d of lookups()['ASSISTIVE_DEVICE']; track d.id) {
                <div class="device-chip" [class.selected]="isDeviceSelected(d.id)" (click)="toggleDevice(d.id)">{{ d.label }}</div>
              }
            </div>
          </div>
        </div>

        <!-- مالی -->
        <div class="section">
          <div class="section-title">اطلاعات مالی</div>
          <div class="form-grid">
            <maz-form-field label="شماره حساب" [control]="f['bankAccountNumber']"><input class="maz-input" formControlName="bankAccountNumber" /></maz-form-field>
            <maz-form-field label="شماره شبا" [control]="f['shabaNumber']" hint="بدون IR"><input class="maz-input" formControlName="shabaNumber" /></maz-form-field>
          </div>
        </div>

        <!-- موارد خاص -->
        <div class="section">
          <div class="section-title">موارد خاص</div>
          <div class="form-grid">
            <div class="checkbox-row"><input type="checkbox" id="c1" formControlName="isMartyrFamily" /><label for="c1">شاهد و ایثارگر</label></div>
            <div class="checkbox-row"><input type="checkbox" id="c2" formControlName="isOrphan" /><label for="c2">یتیم</label></div>
            <div class="checkbox-row"><input type="checkbox" id="c3" formControlName="isUnderWelfare" /><label for="c3">تحت پوشش بهزیستی</label></div>
            <div class="checkbox-row"><input type="checkbox" id="c4" formControlName="isUnderRelief" /><label for="c4">تحت پوشش کمیته امداد امام خمینی</label></div>
            <div class="checkbox-row"><input type="checkbox" id="c5" formControlName="hasNonParentGuardian" /><label for="c5">سرپرست غیر (غیر از پدر/مادر بیولوژیک)</label></div>
          </div>
        </div>

        <!-- فعالیت‌ها -->
        <div class="section">
          <div class="section-title">فعالیت‌ها و دستاوردها</div>
          <div class="form-grid">
            <div class="checkbox-row"><input type="checkbox" id="a1" formControlName="willingCultural" /><label for="a1">تمایل به فعالیت فرهنگی</label></div>
            <div class="checkbox-row"><input type="checkbox" id="a2" formControlName="willingArt" /><label for="a2">تمایل به فعالیت هنری</label></div>
            <div class="checkbox-row"><input type="checkbox" id="a3" formControlName="willingSports" /><label for="a3">تمایل به فعالیت ورزشی</label></div>
            <div class="checkbox-row"><input type="checkbox" id="a4" formControlName="willingQuran" /><label for="a4">تمایل به قرآن و عترت</label></div>
          </div>
          <maz-form-field label="رتبه‌های کسب‌شده" hint="منطقه، استان، کشور — متن آزاد" [control]="f['achievementsText']">
            <input class="maz-input" formControlName="achievementsText" />
          </maz-form-field>
        </div>

        <!-- توضیحات -->
        <div class="section">
          <div class="section-title">توضیحات</div>
          <maz-form-field [control]="f['notes']">
            <textarea class="maz-input" formControlName="notes" rows="3" style="resize:vertical"></textarea>
          </maz-form-field>
        </div>

        <div class="form-actions">
          <a class="maz-btn maz-btn--ghost" routerLink="/students">انصراف</a>
          <button type="submit" class="maz-btn maz-btn--primary" [disabled]="saving()">
            @if (saving()) { <span class="maz-spinner" style="width:14px;height:14px;border-width:2px"></span> }
            {{ isEdit() ? 'ذخیره تغییرات' : 'ثبت دانش‌آموز' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class StudentFormComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private api        = inject(StudentsApi);
  private lookupsApi = inject(LookupsApi);
  private centersApi = inject(CentersApi);
  private gradesApi  = inject(GradesApi);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  readonly appState  = inject(AppStateService);
  readonly auth      = inject(AuthService);

  isEdit    = signal(false);
  studentId = 0;
  saving    = signal(false);
  lookups   = signal<LookupGroups>({});
  centers   = signal<Center[]>([]);
  allGrades = signal<any[]>([]);
  selectedDeviceIds = signal<number[]>([]);

  birthDate = signal<ShamsiDate>({ year: null, month: null, day: null });
  entryDate = signal<ShamsiDate>({ year: null, month: null, day: null });

  ownCenterName = computed(() => {
    const id = this.auth.centerIds()[0];
    return this.centers().find(c => c.id === id)?.name ?? '—';
  });

  filteredGrades = computed(() => {
    const levelId = Number(this.f['educationLevelId'].value);
    if (!levelId) return this.allGrades();
    return this.allGrades().filter((g: any) => g.educationLevelId === levelId);
  });

  showFieldOfStudy = computed(() => {
    const levelId = Number(this.f['educationLevelId'].value);
    const code = (this.lookups()['EDUCATION_LEVEL'] ?? []).find(l => l.id === levelId)?.code ?? '';
    return code === 'SECOND_MIDDLE';
  });

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    gender:    ['MALE', Validators.required],
    address:   [''], homePhone: [''],
    guardianName: [''], guardianNationalCode: [''], guardianPhone: [''],
    guardianPhysicalStatusId: [null as number | null],
    secondGuardianName: [''], secondGuardianNationalCode: [''], secondGuardianPhone: [''],
    secondGuardianPhysicalStatusId: [null as number | null],
    educationLevelId: [null as number | null], gradeId: [null as number | null],
    fieldOfStudyId: [null as number | null], centerId: [null as number | null],
    districtId: [null as number | null], attendanceType: ['SCHOOL_PRESENCE'],
    physicalStatusId: [null as number | null], bookTypeId: [null as number | null],
    speechDisorderId: [null as number | null],
    needsOccupationalTherapy: [false], needsSpeechTherapy: [false], needsPhysiotherapy: [false],
    bankAccountNumber: [''], shabaNumber: [''],
    isMartyrFamily: [false], isOrphan: [false], isUnderWelfare: [false],
    isUnderRelief: [false], hasNonParentGuardian: [false],
    willingCultural: [false], willingArt: [false], willingSports: [false], willingQuran: [false],
    achievementsText: [''], notes: [''],
    disabilities: this.fb.array([]),
  });

  get f() { return this.form.controls; }
  get disabilities() { return this.form.get('disabilities') as FormArray; }
  asGroup(c: any) { return c as FormGroup; }

  isAutism(typeId: any): boolean {
    if (!typeId) return false;
    return (this.lookups()['DISABILITY_TYPE'] ?? []).find(o => o.id === Number(typeId))?.code === 'AUTISM';
  }

  isDeviceSelected(id: number) { return this.selectedDeviceIds().includes(id); }
  toggleDevice(id: number) {
    this.selectedDeviceIds.update(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  onBirthDateChange(date: ShamsiDate) {
  this.birthDate.set(date);
}

onEntryDateChange(date: ShamsiDate) {
  this.entryDate.set(date);
}

  addDisability(item?: any) {
    this.disabilities.push(this.fb.group({
      disabilityTypeId: [item?.disabilityTypeId ?? null],
      severity: [item?.severity ?? null], autismLevel: [item?.autismLevel ?? null],
    }));
  }
  removeDisability(i: number) { this.disabilities.removeAt(i); }
  onLevelChange() { this.f['gradeId'].setValue(null); this.f['fieldOfStudyId'].setValue(null); }

  ngOnInit() {
    forkJoin({
      lookups:  this.lookupsApi.getAllGrouped(),
      grades:   this.gradesApi.findAll(),
      centers:  this.auth.isSuperuser() ? this.centersApi.list({ page: 1, pageSize: 500 }) : of(null),
    }).subscribe(({ lookups, grades, centers }) => {
      this.lookups.set(lookups);
      this.allGrades.set(Array.isArray(grades) ? grades : (grades as any)?.data ?? []);
      if (centers) this.centers.set((centers as any).data ?? []);
      if (!this.auth.isSuperuser() && this.auth.centerIds().length) {
        this.f['centerId'].setValue(this.auth.centerIds()[0]);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true); this.studentId = Number(id);
      this.api.getOne(this.studentId).subscribe(s => {
        this.form.patchValue({ ...s } as any);
        this.birthDate.set({ year: (s as any).birthYearShamsi ?? null, month: (s as any).birthMonth ?? null, day: (s as any).birthDay ?? null });
        this.entryDate.set({ year: (s as any).entryYear ?? null, month: (s as any).entryMonth ?? null, day: (s as any).entryDay ?? null });
        ((s as any).disabilities ?? []).forEach((d: any) => this.addDisability(d));
        this.selectedDeviceIds.set(((s as any).assistiveDevices ?? []).map((x: any) => x.assistiveDeviceId));
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as any;
    val.birthDay = this.birthDate().day; val.birthMonth = this.birthDate().month; val.birthYearShamsi = this.birthDate().year;
    val.entryDay = this.entryDate().day; val.entryMonth = this.entryDate().month; val.entryYear = this.entryDate().year;
    val.assistiveDeviceIds = this.selectedDeviceIds();
    const disItems = (val.disabilities ?? []).filter((d: any) => !!d.disabilityTypeId).map((d: any) => ({
      disabilityTypeId: Number(d.disabilityTypeId),
      severity: this.isAutism(d.disabilityTypeId) ? null : d.severity,
      autismLevel: this.isAutism(d.disabilityTypeId) ? (d.autismLevel ? Number(d.autismLevel) : null) : null,
    }));

    const saveAndNavigate = (s: any) => {
      const doDevices = () => this.api.setAssistiveDevices(s.id, this.selectedDeviceIds()).subscribe({
        next: () => { this.appState.toast(this.isEdit() ? 'دانش‌آموز ویرایش شد' : 'دانش‌آموز ثبت شد', 'success'); this.router.navigate(['/students', s.id]); },
        error: () => { this.saving.set(false); },
      });
      this.api.setDisabilities(s.id, disItems).subscribe({ next: doDevices, error: doDevices });
    };

    if (this.isEdit()) {
      delete val.disabilities;
      this.api.update(this.studentId, val).subscribe({ next: saveAndNavigate, error: e => { this.saving.set(false); this.appState.toast(e.error?.message ?? 'خطا', 'error'); } });
    } else {
      delete val.disabilities;
      val.disabilities = disItems;
      this.api.create(val).subscribe({ next: saveAndNavigate, error: e => { this.saving.set(false); this.appState.toast(e.error?.message ?? 'خطا', 'error'); } });
    }
  }
}
