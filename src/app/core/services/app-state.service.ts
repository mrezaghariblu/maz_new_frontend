import { Injectable, signal } from '@angular/core';
import { AcademicYear } from '../models';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private _sidebarOpen = signal(true);
  private _years = signal<AcademicYear[]>([]);
  private _activeYear = signal<AcademicYear | null>(null);
  private _toast = signal<{ message: string; type: ToastType } | null>(null);

  readonly sidebarOpen = this._sidebarOpen.asReadonly();
  readonly years = this._years.asReadonly();
  readonly activeYear = this._activeYear.asReadonly();
  readonly toastState = this._toast.asReadonly();

  toggleSidebar() {
    this._sidebarOpen.update(v => !v);
  }

  setYears(years: AcademicYear[]) {
    this._years.set(years);
    if (!this._activeYear()) {
      const active = years.find(y => y.isActive) ?? years[0] ?? null;
      if (active) this._activeYear.set(active);
    }
  }

  selectYear(year: AcademicYear) {
    this._activeYear.set(year);
  }

  activeYearId(): number | null {
    return this._activeYear()?.id ?? null;
  }

  toast(message: string, type: ToastType = 'info') {
    this._toast.set({ message, type });
    setTimeout(() => this._toast.set(null), 4000);
  }
}
