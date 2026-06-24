import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CentersApi, LookupsApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { Center, LookupGroups } from '../../../core/models';

@Component({
  selector: 'maz-center-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormFieldComponent],
  styles: [`
    .form-card { max-width: 760px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .form-grid--3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 16px; }
    @media (max-width: 640px) { .form-grid, .form-grid--3 { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 14px; font-weight: 800; color: var(--maz-firouzeh-900);
      margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--maz-border);
    }
  `],
  template: `
    <a class="maz-btn maz-btn--ghost maz-btn--sm" routerLink="/centers" style="margin-bottom:20px;display:inline-flex">← بازگشت</a>

    <div class="maz-page-header">
      <div class="maz-page-header__title">{{ isEdit() ? 'ویرایش مرکز' : 'افزودن مرکز' }}</div>
    </div>

    <div class="maz-card form-card">
      <form [formGroup]="form" (ngSubmit)="submit()">

        <div class="section">
          <div class="section-title">اطلاعات پایه</div>
          <div class="form-grid">
            <maz-form-field label="نام مرکز" [required]="true" [control]="f['name']">
              <input class="maz-input" formControlName="name" />
            </maz-form-field>
            <maz-form-field label="کد مرکز" [required]="true" [control]="f['code']">
              <input class="maz-input" formControlName="code" />
            </maz-form-field>
            <maz-form-field label="نوع مرکز" [required]="true" [control]="f['centerTypeId']">
              <select class="maz-select" formControlName="centerTypeId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['CENTER_TYPE']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="ناحیه آموزشی" [control]="f['districtId']">
              <select class="maz-select" formControlName="districtId">
                <option [value]="null">— انتخاب کنید —</option>
                @for (o of lookups()['DISTRICT']; track o.id) { <option [value]="o.id">{{ o.label }}</option> }
              </select>
            </maz-form-field>
            <maz-form-field label="استان" [required]="true" [control]="f['province']">
              <input class="maz-input" formControlName="province" />
            </maz-form-field>
            <maz-form-field label="شهر" [required]="true" [control]="f['city']">
              <input class="maz-input" formControlName="city" />
            </maz-form-field>
            <maz-form-field label="تلفن" [control]="f['phone']">
              <input class="maz-input" formControlName="phone" />
            </maz-form-field>
            <maz-form-field label="سال تأسیس (شمسی)" [control]="f['establishedYear']">
              <input class="maz-input" type="number" formControlName="establishedYear" />
            </maz-form-field>
          </div>
          <maz-form-field label="آدرس" [required]="true" [control]="f['address']">
            <input class="maz-input" formControlName="address" />
          </maz-form-field>
        </div>

        <div class="section">
          <div class="section-title">کدهای واحد سازمانی</div>
          <div class="form-grid--3">
            <maz-form-field label="کد پیش‌دبستانی" [control]="f['preSchoolCode']">
              <input class="maz-input" formControlName="preSchoolCode" />
            </maz-form-field>
            <maz-form-field label="کد ابتدایی" [control]="f['primaryCode']">
              <input class="maz-input" formControlName="primaryCode" />
            </maz-form-field>
            <maz-form-field label="کد متوسطه اول" [control]="f['firstMiddleCode']">
              <input class="maz-input" formControlName="firstMiddleCode" />
            </maz-form-field>
            <maz-form-field label="کد متوسطه اول پیش‌حرفه‌ای" [control]="f['firstMiddleVocationalCode']">
              <input class="maz-input" formControlName="firstMiddleVocationalCode" />
            </maz-form-field>
            <maz-form-field label="کد متوسطه دوم کاردانش خاص" [control]="f['secondMiddleSpecialVocationalCode']">
              <input class="maz-input" formControlName="secondMiddleSpecialVocationalCode" />
            </maz-form-field>
            <maz-form-field label="کد متوسطه دوم" [control]="f['secondMiddleCode']">
              <input class="maz-input" formControlName="secondMiddleCode" />
            </maz-form-field>
          </div>
        </div>

        <div class="section">
          <div class="section-title">اطلاعات بانکی</div>
          <div class="form-grid">
            <maz-form-field label="شماره حساب" [control]="f['bankAccountNumber']">
              <input class="maz-input" formControlName="bankAccountNumber" />
            </maz-form-field>
            <maz-form-field label="شماره شبا" [control]="f['shabaNumber']">
              <input class="maz-input" formControlName="shabaNumber" placeholder="بدون IR" />
            </maz-form-field>
          </div>
        </div>

        <div class="form-actions">
          <a class="maz-btn maz-btn--ghost" routerLink="/centers">انصراف</a>
          <button type="submit" class="maz-btn maz-btn--primary" [disabled]="saving()">
            @if (saving()) { <span class="maz-spinner" style="width:14px;height:14px;border-width:2px"></span> }
            {{ isEdit() ? 'ذخیره تغییرات' : 'ثبت مرکز' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CenterFormComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private api        = inject(CentersApi);
  private lookupsApi = inject(LookupsApi);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private appState   = inject(AppStateService);

  isEdit = signal(false);
  centerId = 0;
  saving = signal(false);
  lookups = signal<LookupGroups>({});

  form = this.fb.group({
    name:         ['', Validators.required],
    code:         ['', Validators.required],
    centerTypeId: [null as number | null, Validators.required],
    districtId:   [null as number | null],
    province:     ['', Validators.required],
    city:         ['', Validators.required],
    phone:        [''],
    establishedYear: [null as number | null],
    address:      ['', Validators.required],

    preSchoolCode: [''],
    primaryCode:   [''],
    firstMiddleCode: [''],
    firstMiddleVocationalCode: [''],
    secondMiddleSpecialVocationalCode: [''],
    secondMiddleCode: [''],

    bankAccountNumber: [''],
    shabaNumber:       [''],
  });

  get f() { return this.form.controls; }

  ngOnInit() {
    this.lookupsApi.getAllGrouped().subscribe(g => this.lookups.set(g));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.centerId = Number(id);
      this.api.getOne(this.centerId).subscribe({
        next: c => this.form.patchValue({ ...c } as any),
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as Partial<Center>;
    const obs = this.isEdit()
      ? this.api.update(this.centerId, val)
      : this.api.create(val as any);

    obs.subscribe({
      next: c => {
        this.appState.toast(this.isEdit() ? 'مرکز ویرایش شد' : 'مرکز ثبت شد', 'success');
        this.router.navigate(['/centers', c.id]);
      },
      error: e => {
        this.saving.set(false);
        this.appState.toast(e.error?.message ?? 'خطا در ذخیره', 'error');
      },
    });
  }
}
