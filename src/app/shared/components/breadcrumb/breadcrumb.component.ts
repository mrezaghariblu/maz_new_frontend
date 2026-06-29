import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Crumb { label: string; url: string | null; }

const LABELS: Record<string, string> = {
  'dashboard':'داشبورد','users':'پرسنل','students':'دانش‌آموزان',
  'centers':'مراکز','classes':'کلاسبندی','smart-class':'کلاسبندی هوشمند',
  'analytics':'گزارش آماری','academic-years':'سال تحصیلی',
  'status':'وضعیت پرسنلی','audit':'لاگ تغییرات',
  'new':'افزودن','edit':'ویرایش','password':'تغییر رمز',
};

@Component({
  selector: 'maz-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .bc { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--maz-gray-400); padding:6px 0 2px; flex-wrap:wrap; }
    a.bc-item { color:var(--maz-gray-400); text-decoration:none; }
    a.bc-item:hover { color:var(--maz-firouzeh-600); }
    .bc-cur { color:var(--maz-firouzeh-800); font-weight:700; }
    .bc-sep { font-size:10px; color:var(--maz-gray-300); }
  `],
  template: `
    @if (crumbs.length > 1) {
      <nav class="bc">
        @for (c of crumbs; track c.url; let last=$last, first=$first) {
          @if (!last) {
            <a class="bc-item" [routerLink]="c.url">{{ first ? '🏠' : c.label }}</a>
            <span class="bc-sep">‹</span>
          } @else {
            <span class="bc-cur">{{ c.label }}</span>
          }
        }
      </nav>
    }
  `,
})
export class BreadcrumbComponent {
  private router = inject(Router);
  crumbs: Crumb[] = [];

  constructor() {
    this.build();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.build());
  }

  private build() {
    const segs = this.router.url.split('?')[0].split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'داشبورد', url: '/dashboard' }];
    let path = '';
    segs.forEach((seg, i) => {
      path += '/' + seg;
      const label = /^\d+$/.test(seg) ? `#${seg}` : (LABELS[seg] ?? seg);
      crumbs.push({ label, url: i < segs.length - 1 ? path : null });
    });
    this.crumbs = crumbs;
  }
}
