import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CentersApi } from '../../../core/services/api.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { CenterType, Center } from '../../../core/models';

@Component({
  selector: 'maz-center-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormFieldComponent],
  styles: [`
    .form-card { max-width: 640px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
  `],
  template: `
    <a class="maz-btn maz-btn--ghost maz-btn--sm" routerLink="/centers" style="margin-bottom:20px;display:inline-flex">← بازگشت</a>

    <div class="maz-page-header">
      <div class="maz-page-header__title">{{ isEdit() ? 'ویرایش مرکز' : 'افزودن مرکز' }}</div>
    </div>

    <div class="maz-card form-card">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">
          <maz-form-field label="نام مرکز" [required]="true" [control]="f['name']">
            <input class="maz-input" formControlName="name" />
          </maz-form-field>
          <maz-form-field label="کد مرکز" [required]="true" [control]="f['code']">
            <input class="maz-input" formControlName="code" />
          </maz-form-field>
          <maz-form-field label="نوع" [required]="true" [control]="f['type']">
            <select class="maz-select" formControlName="type">
              <option value="PRIMARY">دبستان</option>
              <option value="MIDDLE">متوسطه اول</option>
              <option value="HIGH">دبیرستان</option>
              <option value="VOCATIONAL">هنرستان</option>
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
          <maz-form-field label="آدرس" [control]="f['address']">
            <input class="maz-input" formControlName="address" />
          </maz-form-field>
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
  private fb       = inject(FormBuilder);
  private api      = inject(CentersApi);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private appState = inject(AppStateService);

  isEdit = signal(false);
  centerId = 0;
  saving = signal(false);

  form = this.fb.group({
    name:     ['', Validators.required],
    code:     ['', Validators.required],
    type:     ['PRIMARY' as CenterType, Validators.required],
    province: ['', Validators.required],
    city:     ['', Validators.required],
    phone:    [''],
    address:  [''],
  });

  get f() { return this.form.controls; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.centerId = Number(id);
      this.api.getOne(this.centerId).subscribe({
        next: c => this.form.patchValue({
          name: c.name, code: c.code, type: c.type,
          province: c.province, city: c.city, phone: c.phone ?? '', address: c.address ?? '',
        }),
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as Partial<Center>;
    const obs = this.isEdit()
      ? this.api.update(this.centerId, val)
      : this.api.create(val);

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
