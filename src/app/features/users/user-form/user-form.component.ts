import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { UserType, Gender, User } from '../../../core/models';

@Component({
  selector: 'maz-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormFieldComponent],
  styles: [`
    .form-card { max-width: 640px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
  `],
  template: `
    <a class="maz-btn maz-btn--ghost maz-btn--sm" routerLink="/users" style="margin-bottom:20px;display:inline-flex">← بازگشت</a>

    <div class="maz-page-header">
      <div class="maz-page-header__title">{{ isEdit() ? 'ویرایش پرسنل' : 'افزودن پرسنل' }}</div>
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
          <maz-form-field label="نقش" [required]="true" [control]="f['userType']">
            <select class="maz-select" formControlName="userType">
              <option value="CENTER_MANAGER">مدیر مرکز</option>
              <option value="TEACHER">معلم</option>
              <option value="STAFF">کارمند</option>
            </select>
          </maz-form-field>
          <maz-form-field label="جنسیت" [required]="true" [control]="f['gender']">
            <select class="maz-select" formControlName="gender">
              <option value="MALE">مرد</option>
              <option value="FEMALE">زن</option>
            </select>
          </maz-form-field>
          <maz-form-field label="تلفن" [control]="f['phone']">
            <input class="maz-input" formControlName="phone" />
          </maz-form-field>
          <maz-form-field label="ایمیل" [control]="f['email']">
            <input class="maz-input" type="email" formControlName="email" />
          </maz-form-field>
          @if (!isEdit()) {
            <maz-form-field label="رمز عبور" [required]="true" [control]="f['password']" hint="حداقل ۸ کاراکتر">
              <input class="maz-input" type="password" formControlName="password" />
            </maz-form-field>
          }
        </div>

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
  private fb       = inject(FormBuilder);
  private api      = inject(UsersApi);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private appState = inject(AppStateService);

  isEdit = signal(false);
  userId = 0;
  saving = signal(false);

  form = this.fb.group({
    firstName:    ['', Validators.required],
    lastName:     ['', Validators.required],
    nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    userType:     ['TEACHER' as UserType, Validators.required],
    gender:       ['MALE' as Gender, Validators.required],
    phone:        [''],
    email:        [''],
    password:     ['', [Validators.minLength(8)]],
  });

  get f() { return this.form.controls; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.userId = Number(id);
      this.f['password'].clearValidators();
      this.f['password'].updateValueAndValidity();
      this.api.getOne(this.userId).subscribe({
        next: u => this.form.patchValue({
          firstName: u.firstName, lastName: u.lastName, nationalCode: u.nationalCode,
          userType: u.userType, gender: u.gender, phone: u.phone ?? '', email: u.email ?? '',
        }),
      });
    } else {
      this.f['password'].setValidators([Validators.required, Validators.minLength(8)]);
      this.f['password'].updateValueAndValidity();
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as Partial<User> & { password?: string };
    const obs = this.isEdit()
      ? this.api.update(this.userId, val)
      : this.api.create(val);

    obs.subscribe({
      next: u => {
        this.appState.toast(this.isEdit() ? 'پرسنل ویرایش شد' : 'پرسنل ثبت شد', 'success');
        this.router.navigate(['/users', u.id]);
      },
      error: e => {
        this.saving.set(false);
        this.appState.toast(e.error?.message ?? 'خطا در ذخیره', 'error');
      },
    });
  }
}
