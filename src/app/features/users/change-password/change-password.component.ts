// src/app/features/users/change-password/change-password.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';

function passwordMatchValidator(control: AbstractControl) {
  const pw  = control.get('newPassword')?.value;
  const pw2 = control.get('confirmPassword')?.value;
  return pw && pw2 && pw !== pw2 ? { mismatch: true } : null;
}

@Component({
  selector: 'maz-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormFieldComponent],
  styles: [`
    .pw-card { max-width: 440px; }
    .strength-bar { height: 5px; border-radius: 3px; background: var(--maz-gray-200); margin-top: 6px; overflow: hidden;
      .fill { height: 100%; border-radius: 3px; transition: all .3s; }
    }
    .strength-label { font-size: 11px; margin-top: 4px; font-weight: 600; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
  `],
  template: `
    <a class="maz-btn maz-btn--ghost maz-btn--sm"
      [routerLink]="['/users', userId]" style="margin-bottom:20px;display:inline-flex">
      ← بازگشت به پروفایل
    </a>

    <div class="maz-page-header">
      <div class="maz-page-header__title">تغییر رمز عبور</div>
    </div>

    <div class="maz-card pw-card">
      <form [formGroup]="form" (ngSubmit)="submit()">

        <maz-form-field label="رمز جدید" [required]="true" [control]="f['newPassword']"
          hint="حداقل ۸ کاراکتر — ترکیب حرف و عدد توصیه می‌شود">
          <input class="maz-input" type="password" formControlName="newPassword"
            placeholder="رمز جدید" (input)="checkStrength()" />
          <!-- نمایش قدرت رمز -->
          @if (f['newPassword'].value) {
            <div class="strength-bar">
              <div class="fill" [style.width.%]="strength() * 25" [style.background]="strengthColor()"></div>
            </div>
            <div class="strength-label" [style.color]="strengthColor()">{{ strengthLabel() }}</div>
          }
        </maz-form-field>

        <maz-form-field label="تکرار رمز جدید" [required]="true" [control]="f['confirmPassword']">
          <input class="maz-input" type="password" formControlName="confirmPassword"
            placeholder="تکرار رمز جدید" />
          @if (form.errors?.['mismatch'] && f['confirmPassword'].touched) {
            <div style="font-size:11px;color:var(--maz-danger);margin-top:4px">⚠ رمزها یکسان نیستند</div>
          }
        </maz-form-field>

        <div class="form-actions">
          <a class="maz-btn maz-btn--ghost" [routerLink]="['/users', userId]">انصراف</a>
          <button type="submit" class="maz-btn maz-btn--primary"
            [disabled]="saving() || form.invalid">
            @if (saving()) { <span class="maz-spinner" style="width:14px;height:14px;border-width:2px"></span> }
            ذخیره رمز جدید
          </button>
        </div>

      </form>
    </div>
  `,
})
export class ChangePasswordComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private api      = inject(UsersApi);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private appState = inject(AppStateService);

  userId = 0;
  saving = signal(false);
  strength = signal(0);

  form = this.fb.group({
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  get f() { return this.form.controls; }

  ngOnInit() {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
  }

  checkStrength() {
    const pw = this.f['newPassword'].value ?? '';
    let score = 0;
    if (pw.length >= 8)              score++;
    if (/[A-Z]/.test(pw))            score++;
    if (/[0-9]/.test(pw))            score++;
    if (/[^A-Za-z0-9]/.test(pw))     score++;
    this.strength.set(score);
  }

  strengthColor(): string {
    return ['#dc2626','#f59e0b','#3b82f6','#059669'][this.strength() - 1] ?? '#e5e7eb';
  }

  strengthLabel(): string {
    return ['ضعیف','متوسط','خوب','قوی'][this.strength() - 1] ?? '';
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.api.changePassword(this.userId, this.f['newPassword'].value!).subscribe({
      next: () => {
        this.appState.toast('رمز عبور با موفقیت تغییر کرد', 'success');
        this.router.navigate(['/users', this.userId]);
      },
      error: e => {
        this.saving.set(false);
        this.appState.toast(e.error?.message ?? 'خطا در تغییر رمز', 'error');
      },
    });
  }
}
