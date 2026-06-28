// src/app/features/classes/classes.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface ClassRoom {
  id: number; name: string; centerId: number;
  classGrades: { grade: { id: number; label: string; track: string } }[];
  teacherAssignments: { user: { firstName: string; lastName: string } }[];
  _studentCount?: number;
  _unassignedCount?: number;
  _phantoms?: PhantomStudent[];
}

interface PhantomStudent {
  id: string; name: string; gradeId: number | null; note: string;
}

@Component({
  selector: 'maz-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .classes-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .class-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .class-card {
      background: #fff; border-radius: var(--maz-radius-lg); border: 1px solid var(--maz-border);
      padding: 18px; position: relative;
    }
    .class-card.unassigned { border-color: var(--maz-warning); }
    .class-name { font-size: 15px; font-weight: 800; color: var(--maz-firouzeh-900); margin-bottom: 6px; }
    .class-meta { font-size: 12px; color: var(--maz-gray-500); margin-bottom: 12px; }
    .class-stats { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .stat-chip {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;
      background: var(--maz-firouzeh-50); color: var(--maz-firouzeh-700);
    }
    .stat-chip.warn { background: #fef3c7; color: var(--maz-warning); }
    .class-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    /* Phantom section */
    .phantom-section { margin-top: 14px; border-top: 1px dashed var(--maz-border); padding-top: 12px; }
    .phantom-title { font-size: 12px; font-weight: 700; color: var(--maz-gray-600); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .phantom-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
    .phantom-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--maz-gray-50); border-radius: 8px; font-size: 12px; }
    .phantom-name { flex: 1; color: var(--maz-gray-700); font-style: italic; }
    .phantom-remove { background: none; border: none; color: var(--maz-danger); cursor: pointer; font-size: 14px; padding: 2px; font-family: var(--maz-font); }
    .add-phantom-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .add-phantom-row input, .add-phantom-row select { font-family: var(--maz-font); font-size: 12px; padding: 5px 8px; border: 1.5px solid var(--maz-border); border-radius: 6px; }
    .add-phantom-row input { flex: 1; min-width: 80px; }

    .unassigned-hint { font-size: 11px; color: var(--maz-warning); font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .new-class-form { background:#fff; border-radius: var(--maz-radius-lg); border: 1px dashed var(--maz-firouzeh-300); padding: 18px; margin-bottom: 20px; }
    .form-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
    .form-row label { font-size: 12px; font-weight: 700; color: var(--maz-gray-600); display: block; margin-bottom: 4px; }
    .form-row input, .form-row select { font-family: var(--maz-font); padding: 8px 10px; border: 1.5px solid var(--maz-border); border-radius: 8px; font-size: 13px; }
  `],
  template: `
    <div class="maz-page-header">
      <div class="maz-page-header__title">کلاسبندی</div>
    </div>

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    } @else {

      <!-- New Class Button -->
      <div class="classes-header">
        <div style="font-size:13px;color:var(--maz-gray-500)">
          {{ classes().length }} کلاس — سال تحصیلی {{ appState.activeYear()?.label ?? '—' }}
        </div>
        <button class="maz-btn maz-btn--primary" (click)="showNewForm.set(!showNewForm())">
          + کلاس جدید
        </button>
      </div>

      @if (showNewForm()) {
        <div class="new-class-form">
          <div style="font-size:14px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:14px">ثبت کلاس جدید</div>
          <div class="form-row">
            <div>
              <label>نام کلاس</label>
              <input [(ngModel)]="newClassName" placeholder="مثلاً: کلاس اول الف" style="width:200px" />
            </div>
            <div>
              <label>ظرفیت (اختیاری)</label>
              <input type="number" [(ngModel)]="newClassCapacity" placeholder="۲۰" style="width:80px" />
            </div>
            <button class="maz-btn maz-btn--primary" [disabled]="!newClassName" (click)="createClass()">ثبت</button>
            <button class="maz-btn maz-btn--ghost" (click)="showNewForm.set(false)">انصراف</button>
          </div>
        </div>
      }

      @if (unassignedStudents() > 0) {
        <div class="maz-card" style="border-color:var(--maz-warning);background:#fffbeb;margin-bottom:20px">
          <div class="unassigned-hint">
            ⚠️ <strong>{{ unassignedStudents() }}</strong> دانش‌آموز هنوز به کلاسی تخصیص نیافته‌اند
            <a routerLink="/students" style="margin-right:8px;color:var(--maz-firouzeh-600);font-size:12px">مشاهده دانش‌آموزان ←</a>
          </div>
        </div>
      }

      <div class="class-grid">
        @for (cls of classes(); track cls.id) {
          <div class="class-card" [class.unassigned]="(cls._unassignedCount ?? 0) > 0">
            <div class="class-name">{{ cls.name }}</div>
            <div class="class-meta">
              پایه‌ها: {{ cls.classGrades.map(g => g.grade.label).join('، ') || '—' }}
            </div>
            <div class="class-stats">
              <span class="stat-chip">{{ cls._studentCount ?? 0 }} دانش‌آموز</span>
              @if ((cls._phantoms?.length ?? 0) > 0) {
                <span class="stat-chip" style="background:#f0f4f5">{{ cls._phantoms!.length }} فرضی</span>
              }
              @if ((cls._unassignedCount ?? 0) > 0) {
                <span class="stat-chip warn">{{ cls._unassignedCount }} بدون کلاس</span>
              }
            </div>
            <div class="class-actions">
              <a class="maz-btn maz-btn--sm maz-btn--ghost" [routerLink]="['/students']" [queryParams]="{classId: cls.id}">
                مشاهده دانش‌آموزان
              </a>
            </div>

            <!-- بخش دانش‌آموزان فرضی -->
            <div class="phantom-section">
              <div class="phantom-title">
                👻 دانش‌آموزان فرضی
                <span style="font-size:10px;font-weight:400;color:var(--maz-gray-400)">(برای تخمین ظرفیت سال آینده)</span>
              </div>

              @if (cls._phantoms?.length) {
                <div class="phantom-list">
                  @for (p of cls._phantoms!; track p.id) {
                    <div class="phantom-item">
                      <span class="phantom-name">{{ p.name }}</span>
                      <span style="font-size:11px;color:var(--maz-gray-400)">{{ gradeLabel(p.gradeId, cls) }}</span>
                      <button class="phantom-remove" (click)="removePhantom(cls, p.id)" title="حذف">✕</button>
                    </div>
                  }
                </div>
              }

              <div class="add-phantom-row">
                <input
                  placeholder="نام فرضی (اختیاری)"
                  [(ngModel)]="phantomInputs[cls.id + '_name']"
                  (keydown.enter)="addPhantom(cls)"
                />
                <select [(ngModel)]="phantomInputs[cls.id + '_grade']">
                  <option value="">پایه —</option>
                  @for (g of cls.classGrades; track g.grade.id) {
                    <option [value]="g.grade.id">{{ g.grade.label }}</option>
                  }
                </select>
                <button class="maz-btn maz-btn--sm maz-btn--primary" (click)="addPhantom(cls)">+ افزودن</button>
              </div>

              @if ((cls._phantoms?.length ?? 0) > 0) {
                <div style="margin-top:8px;font-size:11px;color:var(--maz-gray-400)">
                  ظرفیت تخمینی: {{ (cls._studentCount ?? 0) + (cls._phantoms?.length ?? 0) }} نفر
                </div>
              }
            </div>
          </div>
        }

        @if (!classes().length) {
          <div class="maz-card" style="text-align:center;padding:48px;color:var(--maz-gray-400)">
            هنوز کلاسی ثبت نشده است
          </div>
        }
      </div>
    }
  `,
})
export class ClassesComponent implements OnInit {
  readonly appState = inject(AppStateService);
  readonly auth     = inject(AuthService);
  private http      = inject(HttpClient);
  private base      = environment.apiUrl;

  loading           = signal(true);
  classes           = signal<ClassRoom[]>([]);
  unassignedStudents = signal(0);
  showNewForm       = signal(false);
  newClassName      = '';
  newClassCapacity: number | null = null;
  phantomInputs: Record<string, any> = {};

  ngOnInit() { this.loadClasses(); }

  loadClasses() {
    const centerId = this.auth.isSuperuser() ? null : this.auth.centerIds()[0];
    const params: any = { page: 1, pageSize: 200 };
    if (centerId) params.centerId = centerId;

    this.http.post<any>(`${this.base}/classes/list`, params).subscribe({
      next: r => {
        const cls = (r.data ?? r).map((c: any) => ({
          ...c,
          _phantoms: [],
          _studentCount: c.studentCount ?? 0,
        }));
        this.classes.set(cls);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // تعداد دانش‌آموزان کلاسبندی‌نشده
    if (centerId) {
      const yearId = this.appState.activeYearId();
      if (yearId) {
        this.http.get<{ count: number }>(`${this.base}/students/unassigned-count?centerId=${centerId}&academicYearId=${yearId}`)
          .subscribe({ next: r => this.unassignedStudents.set(r.count ?? 0), error: () => {} });
      }
    }
  }

  createClass() {
    if (!this.newClassName) return;
    const centerId = this.auth.centerIds()[0];
    const body: any = { name: this.newClassName };
    if (centerId) body.centerId = centerId;
    if (this.newClassCapacity) body.capacity = this.newClassCapacity;
    const yearId = this.appState.activeYearId();
    if (yearId) body.academicYearId = yearId;

    this.http.post<any>(`${this.base}/classes`, body).subscribe({
      next: () => { this.newClassName = ''; this.newClassCapacity = null; this.showNewForm.set(false); this.loadClasses(); },
      error: e => alert(e.error?.message ?? 'خطا در ثبت کلاس'),
    });
  }

  addPhantom(cls: ClassRoom) {
    const name  = this.phantomInputs[cls.id + '_name'] || `دانش‌آموز فرضی ${(cls._phantoms?.length ?? 0) + 1}`;
    const grade = this.phantomInputs[cls.id + '_grade'] ? Number(this.phantomInputs[cls.id + '_grade']) : null;
    const phantom: PhantomStudent = { id: Date.now().toString(), name, gradeId: grade, note: '' };
    this.classes.update(list =>
      list.map(c => c.id === cls.id
        ? { ...c, _phantoms: [...(c._phantoms ?? []), phantom] }
        : c
      )
    );
    this.phantomInputs[cls.id + '_name']  = '';
    this.phantomInputs[cls.id + '_grade'] = '';
  }

  removePhantom(cls: ClassRoom, phantomId: string) {
    this.classes.update(list =>
      list.map(c => c.id === cls.id
        ? { ...c, _phantoms: (c._phantoms ?? []).filter(p => p.id !== phantomId) }
        : c
      )
    );
  }

  gradeLabel(gradeId: number | null, cls: ClassRoom): string {
    if (!gradeId) return '';
    return cls.classGrades.find(g => g.grade.id === gradeId)?.grade.label ?? '';
  }
}
