import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentsApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { Gender, Student } from '../../../core/models';

@Component({
  selector: 'maz-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormFieldComponent],
  styles: [`
    .form-card { max-width: 640px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
  `],
  template: `
    <a class="maz-btn maz-btn--ghost maz-btn--sm" routerLink="/students" style="margin-bottom:20px;display:inline-flex">← بازگشت</a>

    <div class="maz-page-header">
      <div class="maz-page-header__title">{{ isEdit() ? 'ویرایش دانش‌آموز' : 'افزودن دانش‌آموز' }}</div>
    </div>

    <div class="maz-card form-card">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">
          <maz-form-field label="نام" [required]="true" [control]="f['firstName']">
            <input class="maz-input" formControlName="firstName" />
          </maz-form-field>
          <maz-form-field label="نام خانوادگی" [required]="true" [control]="f['lastName']">
            <input class="maz-input" formControlName="lastName" />
          </maz-form-field>
          <maz-form-field label="کد ملی" [required]="true" [control]="f['nationalCode']">
            <input class="maz-input" formControlName="nationalCode" maxlength="10" />
          </maz-form-field>
          <maz-form-field label="جنسیت" [required]="true" [control]="f['gender']">
            <select class="maz-select" formControlName="gender">
              <option value="MALE">مرد</option>
              <option value="FEMALE">زن</option>
            </select>
          </maz-form-field>
          <maz-form-field label="نام والد" [control]="f['parentName']">
            <input class="maz-input" formControlName="parentName" />
          </maz-form-field>
          <maz-form-field label="تلفن والد" [control]="f['parentPhone']">
            <input class="maz-input" formControlName="parentPhone" />
          </maz-form-field>
          <maz-form-field label="تاریخ تولد" [control]="f['birthDate']">
            <input class="maz-input" type="date" formControlName="birthDate" />
          </maz-form-field>
          <maz-form-field label="آدرس" [control]="f['address']">
            <input class="maz-input" formControlName="address" />
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
  private fb       = inject(FormBuilder);
  private api      = inject(StudentsApi);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private appState = inject(AppStateService);

  isEdit = signal(false);
  studentId = 0;
  saving = signal(false);

  form = this.fb.group({
    firstName:    ['', Validators.required],
    lastName:     ['', Validators.required],
    nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    gender:       ['MALE' as Gender, Validators.required],
    parentName:   [''],
    parentPhone:  [''],
    birthDate:    [''],
    address:      [''],
  });

  get f() { return this.form.controls; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.studentId = Number(id);
      this.api.getOne(this.studentId).subscribe({
        next: s => this.form.patchValue({
          firstName: s.firstName, lastName: s.lastName, nationalCode: s.nationalCode,
          gender: s.gender, parentName: s.parentName ?? '', parentPhone: s.parentPhone ?? '',
          birthDate: s.birthDate ?? '', address: s.address ?? '',
        }),
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as Partial<Student>;
    const obs = this.isEdit()
      ? this.api.update(this.studentId, val)
      : this.api.create(val);

    obs.subscribe({
      next: s => {
        this.appState.toast(this.isEdit() ? 'دانش‌آموز ویرایش شد' : 'دانش‌آموز ثبت شد', 'success');
        this.router.navigate(['/students', s.id]);
      },
      error: e => {
        this.saving.set(false);
        this.appState.toast(e.error?.message ?? 'خطا در ذخیره', 'error');
      },
    });
  }
}
