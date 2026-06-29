// src/app/features/auth/login/login.component.ts
import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'maz-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(ellipse at 30% 20%, rgba(30,154,164,.18) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 80%, rgba(13,61,64,.25) 0%, transparent 60%),
        #0a1a1b;
      padding: 24px;
    }

    .login-card {
      background: rgba(255,255,255,.97);
      border-radius: 20px;
      padding: 44px 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 24px 64px rgba(0,0,0,.4);
      position: relative;
      overflow: hidden;

      /* رگه فیروزه‌ای بالای کارت */
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 4px;
        background: linear-gradient(90deg,
          #5fcdd6, #1e9aa4, #9de3e9, #2db8c4, #5fcdd6
        );
        background-size: 300%;
        animation: stripe 6s ease infinite;
      }
    }
    @keyframes stripe { 0%,100%{background-position:0%} 50%{background-position:100%} }

    .login-gem {
      text-align: center;
      font-size: 48px;
      margin-bottom: 8px;
      filter: drop-shadow(0 4px 8px rgba(30,154,164,.3));
    }

    .login-title {
      text-align: center;
      font-size: 28px;
      font-weight: 900;
      color: var(--maz-firouzeh-900);
      margin-bottom: 4px;
    }

    .login-sub {
      text-align: center;
      font-size: 12px;
      color: var(--maz-gray-400);
      margin-bottom: 36px;
    }

    .field { margin-bottom: 18px; }
    .field-label {
      display: block;
      font-size: 12px; font-weight: 700;
      color: var(--maz-gray-600);
      margin-bottom: 7px;
    }
    .field-input {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid var(--maz-border);
      border-radius: var(--maz-radius-md);
      font-size: 14px;
      font-family: var(--maz-font);
      outline: none;
      transition: all .2s;
      text-align: right;
      direction: ltr;

      &:focus {
        border-color: var(--maz-firouzeh-400);
        box-shadow: 0 0 0 3px rgba(30,154,164,.12);
      }
    }

    .login-btn {
      width: 100%;
      padding: 13px;
      background: var(--maz-firouzeh-700);
      color: #fff;
      border: none;
      border-radius: var(--maz-radius-md);
      font-size: 15px;
      font-weight: 800;
      font-family: var(--maz-font);
      cursor: pointer;
      margin-top: 8px;
      transition: all .2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;

      &:hover:not([disabled]) { background: var(--maz-firouzeh-800); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(10,46,48,.25); }
      &[disabled] { opacity: .6; cursor: not-allowed; }
    }

    .login-error {
      margin-top: 14px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--maz-radius-sm);
      color: var(--maz-danger);
      font-size: 13px;
      text-align: center;
    }

    .login-hint {
      margin-top: 16px;
      text-align: center;
      font-size: 11px;
      color: var(--maz-gray-400);
    }
  `],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-gem"><img src="src/assets/images/logo.svg" alt="لوگو MAZ" style="width:64px;height:64px;object-fit:contain" onerror="this.style.display='none'" /></div>
        <div class="login-title">ماز</div>
        <div class="login-sub">مدیریت استثنایی استان زنجان</div>

        <div class="field">
          <label class="field-label">کد ملی</label>
          <input
            class="field-input"
            type="text"
            placeholder="کد ملی ۱۰ رقمی"
            maxlength="10"
            [(ngModel)]="nationalCode"
            (keydown.enter)="submit()"
          />
        </div>

        <div class="field">
          <label class="field-label">رمز عبور</label>
          <input
            class="field-input"
            type="password"
            placeholder="رمز عبور"
            [(ngModel)]="password"
            (keydown.enter)="submit()"
          />
        </div>

        <button
          class="login-btn"
          (click)="submit()"
          [disabled]="loading()"
        >
          @if (loading()) {
            <span class="maz-spinner" style="width:18px;height:18px;border-width:2px"></span>
            در حال ورود...
          } @else {
            ورود به سامانه
          }
        </button>

        @if (error()) {
          <div class="login-error">{{ error() }}</div>
        }

        <div class="login-hint">
          فقط مدیران مراکز و سوپریوزرها می‌توانند وارد شوند
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  nationalCode = '';
  password     = '';
  loading      = signal(false);
  error        = signal('');

  submit() {
    if (!this.nationalCode || !this.password) {
      this.error.set('کد ملی و رمز عبور را وارد کنید');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login({ nationalCode: this.nationalCode, password: this.password }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.loading.set(false);
        this.error.set(
          e.status === 401 ? 'کد ملی یا رمز عبور اشتباه است' :
          e.status === 403 ? 'شما دسترسی به این سامانه ندارید' :
          'خطا در اتصال به سرور'
        );
      },
    });
  }
}