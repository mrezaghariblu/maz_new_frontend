// src/app/layout/shell/shell.component.ts
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthService }     from '../../core/auth/auth.service';
import { AcademicYearsApi } from '../../core/services/api.service';
import { AcademicYear }    from '../../core/models';

interface NavItem {
  path:  string;
  icon:  string;
  label: string;
  superuserOnly?: boolean;
}

@Component({
  selector: 'maz-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, BreadcrumbComponent],
  styles: [`
    .shell { display: flex; height: 100vh; overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--maz-sidebar-w);
      background: var(--maz-sidebar-bg);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width var(--maz-transition);
      overflow: hidden;
      position: relative;
      z-index: 10;

      &.mini { width: var(--maz-sidebar-w-mini); }
    }

    /* امضای MAZ: رگه فیروزه‌ای روی sidebar */
    .sidebar__gem-stripe {
      height: 4px;
      background: linear-gradient(90deg,
        #5fcdd6 0%, #2db8c4 25%, #9de3e9 50%, #1e9aa4 75%, #5fcdd6 100%
      );
      background-size: 300% 100%;
      animation: gem-shift 8s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes gem-shift {
      0%,100% { background-position: 0% 0%; }
      50%      { background-position: 100% 0%; }
    }

    .sidebar__brand {
      padding: 16px 18px 12px;
      border-bottom: 1px solid rgba(255,255,255,.1);
      flex-shrink: 0;
    }
    .brand-logo {
      display: flex; align-items: center; gap: 10px;
      .brand-gem { font-size: 24px; flex-shrink: 0; }
      .brand-text {
        overflow: hidden;
        .brand-name { font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -.3px; white-space: nowrap; }
        .brand-sub  { font-size: 10px; color: var(--maz-firouzeh-300); margin-top: 1px; white-space: nowrap; }
      }
    }

    .sidebar__year {
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      flex-shrink: 0;
    }
    .year-label { font-size: 10px; color: var(--maz-firouzeh-300); font-weight: 700; margin-bottom: 6px; }
    .year-select {
      width: 100%; padding: 6px 10px;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
      border-radius: var(--maz-radius-sm); color: #fff;
      font-family: var(--maz-font); font-size: 12px; outline: none; cursor: pointer;
      option { background: var(--maz-firouzeh-900); }
    }

    .sidebar__nav {
      flex: 1; padding: 10px 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: var(--maz-radius-md);
      border: none; background: transparent; color: rgba(255,255,255,.65);
      cursor: pointer; font-family: var(--maz-font); font-size: 13px; font-weight: 500;
      width: 100%; text-align: right; text-decoration: none;
      transition: all var(--maz-transition);
      white-space: nowrap; overflow: hidden;

      .nav-icon  { font-size: 17px; flex-shrink: 0; }
      .nav-label { overflow: hidden; text-overflow: ellipsis; }

      &:hover    { background: var(--maz-sidebar-hover); color: #fff; }
      &.active   {
        background: var(--maz-sidebar-active);
        color: #fff;
        border-right: 3px solid var(--maz-firouzeh-300);
        font-weight: 700;
      }
    }

    .sidebar__footer {
      padding: 10px 8px; border-top: 1px solid rgba(255,255,255,.08); flex-shrink: 0;
    }

    .toggle-btn {
      width: 100%; padding: 8px; border-radius: var(--maz-radius-sm);
      border: 1px solid rgba(255,255,255,.15); background: transparent;
      color: rgba(255,255,255,.5); font-size: 12px; cursor: pointer;
      font-family: var(--maz-font); transition: all var(--maz-transition);
      &:hover { color: #fff; border-color: rgba(255,255,255,.3); }
    }

    /* ── Main area ── */
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .topbar {
      height: var(--maz-topbar-h); background: var(--maz-topbar-bg);
      border-bottom: 1px solid var(--maz-border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; flex-shrink: 0;
      box-shadow: 0 1px 4px rgba(10,46,48,.06);
    }
    .topbar__right { display: flex; align-items: center; gap: 12px; }
    .topbar__title { font-size: 16px; font-weight: 800; color: var(--maz-firouzeh-900); }
    .topbar__left  { display: flex; align-items: center; gap: 10px; }

    .user-pill {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px; border-radius: 20px;
      background: var(--maz-firouzeh-50); border: 1px solid var(--maz-firouzeh-200);
      cursor: pointer;
      .user-avatar {
        width: 28px; height: 28px; border-radius: 50%;
        background: var(--maz-firouzeh-600); color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; font-size: 13px;
      }
      .user-name { font-size: 12px; font-weight: 600; color: var(--maz-firouzeh-800); }
    }

    .logout-btn {
      padding: 6px 12px; border-radius: var(--maz-radius-sm);
      border: 1px solid #fecaca; background: #fff5f5;
      color: var(--maz-danger); font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: var(--maz-font);
      transition: all var(--maz-transition);
      &:hover { background: #fee2e2; }
    }

    .page-content {
      flex: 1; overflow-y: auto; padding: 24px;
    }
  `],
  template: `
    <div class="shell">

      <!-- ── Sidebar ── -->
      <aside class="sidebar" [class.mini]="!sidebarOpen()">
        <div class="sidebar__gem-stripe"></div>

        <div class="sidebar__brand">
          <div class="brand-logo">
            <span class="brand-gem"><img src="src\assets\images\logo.svg" alt="MAZ" style="width:32px;height:32px;object-fit:contain" onerror="this.style.display='none'" /></span>
            <div class="brand-text" *ngIf="sidebarOpen()">
              <div class="brand-name">ماز</div>
              <div class="brand-sub">مدیریت استثنایی استان زنجان</div>
            </div>
          </div>
        </div>

        <div class="sidebar__year" *ngIf="sidebarOpen()">
          <div class="year-label">سال تحصیلی</div>
          <select class="year-select" [value]="activeYear()?.id" (change)="onYearChange($event)">
            <option *ngFor="let y of years()" [value]="y.id">
              {{ y.label }}{{ y.isActive ? ' ✓' : '' }}{{ y.isArchived ? ' 📁' : '' }}
            </option>
          </select>
        </div>

        <nav class="sidebar__nav">
          @for (item of visibleNavItems(); track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label" *ngIf="sidebarOpen()">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar__footer">
          <button class="toggle-btn" (click)="appState.toggleSidebar()">
            {{ sidebarOpen() ? '⮜ جمع کردن' : '⮞' }}
          </button>
        </div>
      </aside>

      <!-- ── Main ── -->
      <div class="main">
        <header class="topbar">
          <div class="topbar__right">
            <span class="topbar__title">{{ pageTitle() }}</span>
          </div>
          <div class="topbar__left">
            <div class="user-pill">
              <div class="user-avatar">{{ userInitial() }}</div>
              <span class="user-name">{{ userTypeLabel() }}</span>
            </div>
            <button class="logout-btn" (click)="auth.logout()">خروج</button>
          </div>
        </header>

        <main class="page-content">
          <maz-breadcrumb />
      <router-outlet />
        </main>
      </div>

    </div>
  `,
})
export class ShellComponent implements OnInit {
  readonly appState = inject(AppStateService);
  readonly auth     = inject(AuthService);
  private yearsApi  = inject(AcademicYearsApi);

  readonly sidebarOpen = this.appState.sidebarOpen;
  readonly years       = this.appState.years;
  readonly activeYear  = this.appState.activeYear;

  readonly navItems: NavItem[] = [
    { path: 'dashboard',       icon: '📊', label: 'داشبورد' },
    { path: 'users',           icon: '👤', label: 'پرسنل' },
    { path: 'students',        icon: '🎓', label: 'دانش‌آموزان' },
    { path: 'classes',         icon: '📚', label: 'کلاسبندی' },
    { path: 'smart-class',     icon: '🤖', label: 'کلاسبندی هوشمند' },
    { path: 'centers',         icon: '🏫', label: 'مراکز', superuserOnly: true },
    { path: 'analytics',       icon: '📊', label: 'گزارش آماری', superuserOnly: true },
    { path: 'status',          icon: '🔄', label: 'وضعیت پرسنلی' },
    { path: 'academic-years',  icon: '📅', label: 'سال تحصیلی', superuserOnly: true },
    { path: 'audit',           icon: '📋', label: 'لاگ تغییرات',  superuserOnly: true },
  ];

  readonly visibleNavItems = computed(() =>
    this.navItems.filter(n => !n.superuserOnly || this.auth.isSuperuser())
  );

  readonly userInitial  = computed(() => {
    const t = this.auth.userType();
    return t === 'SUPERUSER' ? 'س' : 'م';
  });

  readonly userTypeLabel = computed(() => {
    const map: Record<string, string> = {
      SUPERUSER: 'سوپریوزر', CENTER_MANAGER: 'مدیر مرکز',
    };
    return map[this.auth.userType() ?? ''] ?? '';
  });

  readonly pageTitle = computed(() => {
    const y = this.activeYear();
    return y ? `سال تحصیلی ${y.label}` : 'ماز';
  });

  ngOnInit() {
    this.yearsApi.getAll().subscribe(years => this.appState.setYears(years));
  }

  onYearChange(e: Event) {
    const id = Number((e.target as HTMLSelectElement).value);
    const year = this.years().find(y => y.id === id);
    if (year) this.appState.selectYear(year);
  }
}
