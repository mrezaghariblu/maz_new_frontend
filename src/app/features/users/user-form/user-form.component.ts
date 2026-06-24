import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { UsersApi, LookupsApi, CentersApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { UserType, Gender, User, LookupGroups, Center, DisabilitySeverity } from '../../../core/models';

@Component({
  selector: 'maz-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormFieldComponent],
  styles: [`
    .form-card { max-width: 860px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-grid--3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 16px; }
    @media (max-width: 760px) { .form-grid, .form-grid--3 { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }

    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 14px; font-weight: 800; color: var(--maz-firouzeh-900);
      margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--maz-border);
      display: flex; align-items: center; gap: 8px;
    }

    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .checkbox-row label { font-size: 13px; color: var(--maz-gray-700); cursor: pointer; }

    .disability-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: end;
      padding: 12px; background: var(--maz-gray-50); border-radius: var(--maz-radius-md); margin-bottom: 10px;
    }
    @media (max-width: 760px) { .disability-row { grid-template-columns: 1fr; } }
    .remove-btn {
      border: none; background: var(--maz-danger); color: #fff; border-radius: 8px;
      width: 34px; height: 34px; cursor: pointer; font-size: 16px; flex-shrink: 0;
    }
    .add-disability-btn {
      border: 1px dashed var(--maz-firouzeh-300); background: var(--maz-firouzeh-50);
      color: var(--maz-firouzeh-700); border-radius: var(--maz-radius-md);
      padding: 10px; width: 100%; font-size: 13px; font-weight: 700; cursor: pointer;
    }
    .multi-tag {
      display: inline-block; font-size: 11px; font-weight: 700; color: var(--maz-gold-600);
      background: var(--maz-gold-100); padding: 2px 8px; border-radius: 6px; margin-bottom: 10px;
    }
  `],
  template: `
    <a class="maz-btn maz-btn--ghost maz-btn--sm" routerLink="/users" style="margin-bottom:20px;display:inline-flex">← بازگشت</a>

    <div class="maz-page-header">
      <div class="maz-page-header__title">{{ isEdit() ? 'ویرایش پرسنل' : 'افزودن پرسنل' }}</div>
    </div>

    <div class="maz-card form-card">
      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- ───────── هویتی ───────── -->
        <div class="section">
          <div class="section-title">اطلاعات هویتی</div>
          <div class="form-grid">
            <maz-form-field label="نام" [required]="true" [control]="f['firstName']">
              <input class="maz-input" formControlName="firstName" />
            </maz-form-field>
            <maz-form-field label="نام خانوادگی" [required]="true" [control]="f['lastName']">
              <input class="maz-input" formControlName="lastName" />
            </maz-form-field>
            <maz-form-field label="نام پدر" [control]="f['fatherName']">
              <input class="maz-input" formControlName="fatherName" />
            </maz-form-field>
            <maz-form-field label="کد ملی" [required]="true" [control]="f['nationalCode']">
              <input class="maz-input" formControlName="nationalCode" maxlength="10" />
            </maz-form-field>
            <maz-form-field label="کد پرسنلی" [control]="f['personnelCode']">
              <input class="maz-input" formControlName="personnelCode" />
            </maz-form-field>
            <maz-form-field label="جنسیت" [required]="true" [control]="f['gender']">
              <select class="maz-select" formControlName="gender">
                <option value="MALE">مرد</option>
                <option value="FEMALE">زن</option>
              </select>
            </maz-form-field>
            <maz-form-field label="نقش" [required]="true" [control]="f['userType']">
              <select class="maz-select" formControlName="userType">
                <option value="CENTER_MANAGER">مدیر مرکز</option>
                <option value="TEACHER">معلم</option>
                <option value="STAFF">کارمند</option>
              </select>
            </maz-form-field>
            <maz-form-field label="تلفن همراه" [control]="f['phone']">
              <input class="maz-input" formControlName="phone" />
            </maz-form-field>
            <maz-form-field label="ایمیل" [control]="f['email']">
              <input class="maz-input" type="email" formControlName="email" />
            </maz-form-field>
          </div>
          <div class="form-grid--3">
            <maz-form-field label="روز تولد (شمسی)" [control]="f['birthDay']">
              <input class="maz-input" type="number" min="1" max="31" formControlName="birthDay" />
            </maz-form-field>
            <maz-form-field label="ماه تولد (شمسی)" [control]="f['birthMonth']">
              <input class="maz-input" type="number" min="1" max="12" formControlName="birthMonth" />
            </maz-form-field>
            <maz-form-field label="سال تولد (شمسی)" [control]="f['birthYearShamsi']">
              <input class="maz-input" type="number" formControlName="birthYearShamsi" />
            </maz-form-field>
          </div>
        </div>

        <!-- ───────── اشتغال ───────── -->
        <div class="section">
          <div class="section-title">اشتغال</div>
          <div class="form-grid">
            <maz-form-field label="نوع استخدام" [control]="f['employmentTypeId']">
              <select class="maz-select" formControlName="employmentTypeId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['EMPLOYMENT_TYPE']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="عنوان پست" [control]="f['jobPositionId']">
              <select class="maz-select" formControlName="jobPositionId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['JOB_POSITION']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="رسته استخدام" [control]="f['employmentCategoryId']">
              <select class="maz-select" formControlName="employmentCategoryId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['EMPLOYMENT_CATEGORY']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="ساعت موظف" [control]="f['requiredHours']">
              <input class="maz-input" type="number" step="0.5" formControlName="requiredHours" />
            </maz-form-field>
            <maz-form-field label="ساعات غیرموظف" [control]="f['nonRequiredHours']">
              <input class="maz-input" type="number" step="0.5" formControlName="nonRequiredHours" />
            </maz-form-field>
          </div>

          <div class="form-grid--3">
            <maz-form-field label="روز ورود به استثنایی" [control]="f['exceptionalEntryDay']">
              <input class="maz-input" type="number" min="1" max="31" formControlName="exceptionalEntryDay" />
            </maz-form-field>
            <maz-form-field label="ماه ورود به استثنایی" [control]="f['exceptionalEntryMonth']">
              <input class="maz-input" type="number" min="1" max="12" formControlName="exceptionalEntryMonth" />
            </maz-form-field>
            <maz-form-field label="سال ورود به استثنایی" [control]="f['exceptionalEntryYear']">
              <input class="maz-input" type="number" formControlName="exceptionalEntryYear" />
            </maz-form-field>
          </div>
          <div class="form-grid--3">
            <maz-form-field label="سابقه خدمت (سال)" [control]="f['serviceRecordYears']">
              <input class="maz-input" type="number" formControlName="serviceRecordYears" />
            </maz-form-field>
            <maz-form-field label="سابقه خدمت (ماه)" [control]="f['serviceRecordMonths']">
              <input class="maz-input" type="number" min="0" max="11" formControlName="serviceRecordMonths" />
            </maz-form-field>
            <maz-form-field label="سابقه خدمت (روز)" [control]="f['serviceRecordDays']">
              <input class="maz-input" type="number" min="0" max="30" formControlName="serviceRecordDays" />
            </maz-form-field>
          </div>
        </div>

        <!-- ───────── تحصیلات و وضعیت فردی ───────── -->
        <div class="section">
          <div class="section-title">تحصیلات و وضعیت فردی</div>
          <div class="form-grid">
            <maz-form-field label="مدرک تحصیلی" [control]="f['educationDegreeId']">
              <select class="maz-select" formControlName="educationDegreeId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['EDUCATION_DEGREE']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="رشته تحصیلی" [control]="f['fieldOfStudy']">
              <input class="maz-input" formControlName="fieldOfStudy" />
            </maz-form-field>
            <maz-form-field label="وضعیت تأهل" [control]="f['maritalStatusId']">
              <select class="maz-select" formControlName="maritalStatusId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['MARITAL_STATUS']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="وضعیت ایثارگری" [control]="f['isargariStatus']" hint="مثلاً: جانباز، آزاده، خانواده شهید">
              <input class="maz-input" formControlName="isargariStatus" />
            </maz-form-field>
            <maz-form-field label="وضعیت جسمانی" [control]="f['physicalStatusId']">
              <select class="maz-select" formControlName="physicalStatusId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['PHYSICAL_STATUS']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="ناحیه آموزشی" [control]="f['districtId']">
              <select class="maz-select" formControlName="districtId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['DISTRICT']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
          </div>
        </div>

        <!-- ───────── معلولیت‌ها ───────── -->
        <div class="section">
          <div class="section-title">معلولیت‌ها</div>
          @if (disabilities.length > 1) {
            <span class="multi-tag">چندمعلولیتی</span>
          }
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
                    <option [value]="null">—</option>
                    <option [value]="1">سطح ۱</option>
                    <option [value]="2">سطح ۲</option>
                    <option [value]="3">سطح ۳</option>
                  </select>
                </maz-form-field>
              } @else {
                <maz-form-field label="شدت">
                  <select class="maz-select" formControlName="severity">
                    <option [value]="null">—</option>
                    <option value="MILD">خفیف</option>
                    <option value="MODERATE">متوسط</option>
                    <option value="SEVERE">شدید</option>
                  </select>
                </maz-form-field>
              }
              <div></div>
              <button type="button" class="remove-btn" (click)="removeDisability(i)">×</button>
            </div>
          }
          <button type="button" class="add-disability-btn" (click)="addDisability()">+ افزودن معلولیت</button>
        </div>

        <!-- ───────── تماس و بانک ───────── -->
        <div class="section">
          <div class="section-title">تماس و بانک</div>
          <div class="form-grid">
            <maz-form-field label="آدرس منزل" [control]="f['address']">
              <input class="maz-input" formControlName="address" />
            </maz-form-field>
            <maz-form-field label="شماره حساب" [control]="f['bankAccountNumber']">
              <input class="maz-input" formControlName="bankAccountNumber" />
            </maz-form-field>
            <maz-form-field label="شماره همراه شاد" [control]="f['shadMobileNumber']">
              <input class="maz-input" formControlName="shadMobileNumber" />
            </maz-form-field>
            <maz-form-field label="نام کاربری شاد" [control]="f['shadUsername']">
              <input class="maz-input" formControlName="shadUsername" />
            </maz-form-field>
          </div>
        </div>

        <!-- ───────── داوری مسابقات ───────── -->
        <div class="section">
          <div class="section-title">داوری مسابقات</div>
          <div class="checkbox-row">
            <input type="checkbox" id="judgeCultural" formControlName="willingJudgeCultural" />
            <label for="judgeCultural">تمایل به داوری مسابقات فرهنگی</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="judgeQuran" formControlName="willingJudgeQuranEtrat" />
            <label for="judgeQuran">تمایل به داوری مسابقات قرآن و عترت</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="judgeSports" formControlName="willingJudgeSports" />
            <label for="judgeSports">تمایل به داوری مسابقات ورزشی</label>
          </div>
          <maz-form-field label="دارای مدرک داوری در رشته" [control]="f['judgeCertificateField']">
            <input class="maz-input" formControlName="judgeCertificateField" placeholder="نام رشته را وارد کنید" />
          </maz-form-field>
        </div>

        <!-- ───────── تخصیص به مرکز (فقط هنگام ثبت) ───────── -->
        @if (!isEdit()) {
          <div class="section">
            <div class="section-title">تخصیص به مرکز</div>
            <div class="form-grid">
              <maz-form-field label="مرکز" [control]="f['centerId']" [required]="auth.hasRole('CENTER_MANAGER')">
                @if (auth.isSuperuser()) {
                  <select class="maz-select" formControlName="centerId">
                    <option [value]="null">— بدون تخصیص —</option>
                    @for (c of centers(); track c.id) { <option [value]="c.id">{{ c.name }} — {{ c.city }}</option> }
                  </select>
                } @else {
                  <input class="maz-input" [value]="ownCenterName()" disabled />
                }
              </maz-form-field>
              <maz-form-field label="سال تحصیلی" [control]="f['academicYearId']">
                <select class="maz-select" formControlName="academicYearId">
                  @for (y of appState.years(); track y.id) { <option [value]="y.id">{{ y.label }}</option> }
                </select>
              </maz-form-field>
            </div>
          </div>
        }

        <!-- ───────── رمز عبور ───────── -->
        @if (!isEdit() && canLoginForSelectedType()) {
          <div class="section">
            <div class="section-title">حساب کاربری</div>
            <maz-form-field label="رمز عبور" [required]="true" [control]="f['password']" hint="حداقل ۶ کاراکتر">
              <input class="maz-input" type="password" formControlName="password" />
            </maz-form-field>
          </div>
        }

        <div class="form-actions">
          <a class="maz-btn maz-btn--ghost" routerLink="/users">انصراف</a>
          <button type="submit" class="maz-btn maz-btn--primary" [disabled]="saving()">
            @if (saving()) { <span class="maz-spinner" style="width:14px;height:14px;border-width:2px"></span> }
            {{ isEdit() ? 'ذخیره تغییرات' : 'ثبت پرسنل' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class UserFormComponent implements OnInit {
  private fb        = inject(FormBuilder);
  private api       = inject(UsersApi);
  private lookupsApi = inject(LookupsApi);
  private centersApi = inject(CentersApi);
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  readonly appState = inject(AppStateService);
  readonly auth     = inject(AuthService);

  isEdit = signal(false);
  userId = 0;
  saving = signal(false);
  lookups = signal<LookupGroups>({});
  centers = signal<Center[]>([]);

  ownCenterName = computed(() => {
    const id = this.auth.centerIds()[0];
    return this.centers().find(c => c.id === id)?.name ?? '—';
  });

  form = this.fb.group({
    firstName:    ['', Validators.required],
    lastName:     ['', Validators.required],
    fatherName:   [''],
    nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    personnelCode: [''],
    userType:     ['TEACHER' as UserType, Validators.required],
    gender:       ['MALE' as Gender, Validators.required],
    phone:        [''],
    email:        [''],
    birthDay:        [null as number | null],
    birthMonth:      [null as number | null],
    birthYearShamsi: [null as number | null],

    employmentTypeId:     [null as number | null],
    jobPositionId:        [null as number | null],
    employmentCategoryId: [null as number | null],
    requiredHours:        [null as number | null],
    nonRequiredHours:     [null as number | null],
    exceptionalEntryDay:   [null as number | null],
    exceptionalEntryMonth: [null as number | null],
    exceptionalEntryYear:  [null as number | null],
    serviceRecordYears:    [null as number | null],
    serviceRecordMonths:   [null as number | null],
    serviceRecordDays:     [null as number | null],

    maritalStatusId:   [null as number | null],
    educationDegreeId: [null as number | null],
    fieldOfStudy:      [''],
    isargariStatus:    [''],
    physicalStatusId:  [null as number | null],

    address:            [''],
    bankAccountNumber:  [''],
    shadMobileNumber:   [''],
    shadUsername:       [''],
    districtId:         [null as number | null],

    willingJudgeCultural:   [false],
    willingJudgeQuranEtrat: [false],
    willingJudgeSports:     [false],
    judgeCertificateField:  [''],

    disabilities: this.fb.array([]),

    centerId:       [null as number | null],
    academicYearId: [null as number | null],

    password: [''],
  });

  get f() { return this.form.controls; }
  get disabilities() { return this.form.get('disabilities') as FormArray; }
  asGroup(c: any) { return c as FormGroup; }

  isAutism(disabilityTypeId: number | null): boolean {
    if (!disabilityTypeId) return false;
    const row = (this.lookups()['DISABILITY_TYPE'] ?? []).find(o => o.id === Number(disabilityTypeId));
    return row?.code === 'AUTISM';
  }

  canLoginForSelectedType(): boolean {
    const t = this.f['userType'].value;
    return t === 'SUPERUSER' || t === 'CENTER_MANAGER';
  }

  addDisability(item?: { disabilityTypeId: number | null; severity?: DisabilitySeverity | null; autismLevel?: number | null }) {
    this.disabilities.push(this.fb.group({
      disabilityTypeId: [item?.disabilityTypeId ?? null],
      severity:         [item?.severity ?? null],
      autismLevel:      [item?.autismLevel ?? null],
    }));
  }

  removeDisability(i: number) {
    this.disabilities.removeAt(i);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    forkJoin({
      lookups: this.lookupsApi.getAllGrouped(),
      centers: this.auth.isSuperuser() || this.auth.hasRole('CENTER_MANAGER')
        ? this.centersApi.list({ page: 1, pageSize: 500 })
        : of(null),
    }).subscribe(({ lookups, centers }) => {
      this.lookups.set(lookups);
      if (centers) this.centers.set(centers.data);

      // مدیر مرکز: مرکز خودش از پیش انتخاب می‌شود
      if (!this.auth.isSuperuser() && this.auth.centerIds().length) {
        this.f['centerId'].setValue(this.auth.centerIds()[0]);
      }
      const activeYearId = this.appState.activeYearId();
      if (activeYearId) this.f['academicYearId'].setValue(activeYearId);
    });

    if (id) {
      this.isEdit.set(true);
      this.userId = Number(id);
      this.f['password'].clearValidators();
      this.f['password'].updateValueAndValidity();

      this.api.getOne(this.userId).subscribe({
        next: u => {
          this.form.patchValue({ ...u } as any);
          (u.disabilities ?? []).forEach(d => this.addDisability({
            disabilityTypeId: d.disabilityTypeId,
            severity: d.severity ?? null,
            autismLevel: d.autismLevel ?? null,
          }));
        },
      });
    } else {
      this.f['password'].setValidators([Validators.required, Validators.minLength(6)]);
      this.f['password'].updateValueAndValidity();
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as any;

    if (!this.canLoginForSelectedType()) delete val.password;
    if (!val.password) delete val.password;
    if (!val.centerId) { delete val.centerId; delete val.academicYearId; }

    const disabilityItems = (val.disabilities ?? [])
      .filter((d: any) => !!d.disabilityTypeId)
      .map((d: any) => ({
        disabilityTypeId: Number(d.disabilityTypeId),
        severity: this.isAutism(d.disabilityTypeId) ? null : d.severity,
        autismLevel: this.isAutism(d.disabilityTypeId) ? Number(d.autismLevel) : null,
      }));

    if (this.isEdit()) {
      // در ویرایش، معلولیت‌ها endpoint جدا دارند
      delete val.disabilities;
      this.api.update(this.userId, val).subscribe({
        next: u => {
          this.api.setDisabilities(this.userId, disabilityItems).subscribe({
            next: () => {
              this.appState.toast('پرسنل ویرایش شد', 'success');
              this.router.navigate(['/users', u.id]);
            },
            error: e => {
              this.saving.set(false);
              this.appState.toast(e.error?.message ?? 'خطا در ذخیره معلولیت‌ها', 'error');
            },
          });
        },
        error: e => {
          this.saving.set(false);
          this.appState.toast(e.error?.message ?? 'خطا در ذخیره', 'error');
        },
      });
    } else {
      val.disabilities = disabilityItems;
      this.api.create(val).subscribe({
        next: u => {
          this.appState.toast('پرسنل ثبت شد', 'success');
          this.router.navigate(['/users', u.id]);
        },
        error: e => {
          this.saving.set(false);
          this.appState.toast(e.error?.message ?? 'خطا در ذخیره', 'error');
        },
      });
    }
  }
}
