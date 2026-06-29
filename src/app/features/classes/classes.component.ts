// src/app/features/classes/classes.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { LookupsApi } from '../../core/services/api.service';
import { environment } from '@environments/environment';

interface ClassRoom {
  id: number; name: string; centerId: number; academicYearId: number;
  classGrades: { grade: { id: number; label: string; track: string } }[];
  teacherAssignments: { id: number; user: { id: number; firstName: string; lastName: string }; subject?: { label: string } }[];
  studentAssignments?: { id: number; student: { id: number; firstName: string; lastName: string; gender: string }; grade: { label: string } }[];
  _studentCount?: number;
  _phantoms?: PhantomStudent[];
}
interface PhantomStudent { id: string; name: string; gradeId: number | null; }

@Component({
  selector: 'maz-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .page-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .class-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px,1fr)); gap:16px; }
    .class-card { background:#fff; border-radius:var(--maz-radius-lg); border:1px solid var(--maz-border); overflow:hidden; }
    .card-head { padding:13px 15px; display:flex; align-items:center; justify-content:space-between; background:var(--maz-firouzeh-50); gap:8px; }
    .card-name { font-size:14px; font-weight:800; color:var(--maz-firouzeh-900); flex:1; }
    .card-actions-row { display:flex; gap:6px; }
    .card-meta { padding:10px 15px; display:flex; gap:6px; flex-wrap:wrap; }
    .chip { padding:3px 9px; border-radius:10px; font-size:11px; font-weight:700; }
    .chip-grade { background:var(--maz-firouzeh-50); color:var(--maz-firouzeh-700); }
    .chip-count { background:#e0f2fe; color:#0369a1; }
    .chip-teacher { background:#f0fdf4; color:#166534; }
    .chip-warn { background:#fef3c7; color:#92400e; }

    /* Student list panel inside card */
    .students-panel { border-top:1px solid var(--maz-border); }
    .students-panel-header { padding:8px 15px; font-size:11px; font-weight:800; color:var(--maz-gray-500); background:var(--maz-gray-50); display:flex; justify-content:space-between; }
    .student-row { display:flex; align-items:center; gap:8px; padding:6px 15px; font-size:12px; border-bottom:1px solid var(--maz-border); }
    .student-row:last-child { border-bottom:none; }
    .s-name { flex:1; font-weight:600; }
    .s-grade { font-size:10px; color:var(--maz-gray-400); }
    .gender-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .gender-dot.male { background:#3b82f6; }
    .gender-dot.female { background:#ec4899; }

    /* Teacher assign panel */
    .teacher-panel { border-top:1px solid var(--maz-border); padding:10px 15px; }
    .teacher-label { font-size:11px; font-weight:800; color:var(--maz-gray-500); margin-bottom:6px; }
    .teacher-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .teacher-name { font-size:12px; font-weight:600; flex:1; }
    .assign-row { display:flex; gap:6px; align-items:center; margin-top:6px; flex-wrap:wrap; }
    .assign-row select, .assign-row input { font-family:var(--maz-font); font-size:12px; padding:5px 8px; border:1.5px solid var(--maz-border); border-radius:6px; }

    /* Phantom */
    .phantom-section { border-top:1px dashed var(--maz-border); padding:10px 15px; }
    .phantom-title { font-size:11px; font-weight:700; color:var(--maz-gray-500); margin-bottom:6px; }
    .phantom-row { display:flex; align-items:center; gap:6px; font-size:12px; padding:3px 0; }
    .phantom-name { flex:1; font-style:italic; color:var(--maz-gray-600); }
    .rm-btn { background:none; border:none; color:#dc2626; cursor:pointer; font-family:var(--maz-font); }
    .add-phantom { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
    .add-phantom input, .add-phantom select { font-family:var(--maz-font); font-size:12px; padding:5px 8px; border:1.5px solid var(--maz-border); border-radius:6px; }
    .add-phantom input { flex:1; min-width:80px; }
    .cap-hint { font-size:11px; color:var(--maz-firouzeh-600); margin-top:4px; }

    /* New class form */
    .new-form { background:#fff; border:1.5px dashed var(--maz-firouzeh-300); border-radius:var(--maz-radius-lg); padding:16px; margin-bottom:16px; }
    .form-row { display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end; }
    .form-col { display:flex; flex-direction:column; gap:4px; }
    .form-col label { font-size:11px; font-weight:700; color:var(--maz-gray-600); }
    .form-col input, .form-col select { font-family:var(--maz-font); font-size:13px; padding:7px 10px; border:1.5px solid var(--maz-border); border-radius:8px; }

    /* Edit modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
    .modal-box { background:#fff; border-radius:var(--maz-radius-lg); width:100%; max-width:420px; padding:24px; }
    .modal-title { font-size:15px; font-weight:800; color:var(--maz-firouzeh-900); margin-bottom:16px; }
    .modal-actions { display:flex; gap:8px; margin-top:16px; }
  `],
  template: `
    <div class="maz-page-header">
      <div class="maz-page-header__title">کلاسبندی</div>
      <div class="page-actions">
        <span style="font-size:12px;color:var(--maz-gray-400)">{{ classes().length }} کلاس</span>
        <a class="maz-btn maz-btn--ghost maz-btn--sm" routerLink="/smart-class">🤖 کلاسبندی هوشمند</a>
        <button class="maz-btn maz-btn--primary maz-btn--sm" (click)="showNew.set(true)">+ کلاس جدید</button>
      </div>
    </div>

    @if (showNew()) {
      <div class="new-form">
        <div style="font-size:13px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:12px">کلاس جدید</div>
        <div class="form-row">
          <div class="form-col" style="flex:2">
            <label>نام کلاس *</label>
            <input [(ngModel)]="newName" placeholder="مثلاً: کلاس اول الف" />
          </div>
          <div class="form-col">
            <label>ظرفیت</label>
            <input type="number" [(ngModel)]="newCapacity" placeholder="۱۲" style="width:70px" />
          </div>
          <button class="maz-btn maz-btn--primary" [disabled]="!newName" (click)="createClass()">ثبت</button>
          <button class="maz-btn maz-btn--ghost" (click)="showNew.set(false)">انصراف</button>
        </div>
      </div>
    }

    @if (loading()) {
      <div class="maz-loading-overlay"><div class="maz-spinner"></div></div>
    }

    <div class="class-grid">
      @for (cls of classes(); track cls.id) {
        <div class="class-card">
          <!-- Header -->
          <div class="card-head">
            <span class="card-name">{{ cls.name }}</span>
            <div class="card-actions-row">
              <button class="maz-btn maz-btn--sm maz-btn--ghost" title="ویرایش" (click)="openEdit(cls)">✏️</button>
              <button class="maz-btn maz-btn--sm maz-btn--ghost" title="حذف" (click)="deleteClass(cls)">🗑️</button>
            </div>
          </div>

          <!-- Meta chips -->
          <div class="card-meta">
            @for (cg of cls.classGrades; track cg.grade.id) {
              <span class="chip chip-grade">{{ cg.grade.label }}</span>
            }
            <span class="chip chip-count">{{ activeStudentCount(cls) }} دانش‌آموز</span>
            @if ((cls._phantoms?.length ?? 0) > 0) {
              <span class="chip" style="background:#f5f3ff;color:#5b21b6">{{ cls._phantoms!.length }} فرضی</span>
            }
            @if (cls.teacherAssignments.length > 0) {
              <span class="chip chip-teacher">{{ cls.teacherAssignments[0].user.firstName }} {{ cls.teacherAssignments[0].user.lastName }}</span>
            }
            @if (cls.teacherAssignments.length === 0) {
              <span class="chip chip-warn">بدون معلم</span>
            }
          </div>

          <!-- Students panel -->
          @if (expandedStudents().has(cls.id)) {
            <div class="students-panel">
              <div class="students-panel-header">
                <span>دانش‌آموزان ({{ activeStudentCount(cls) }} نفر)</span>
                <button class="maz-btn maz-btn--sm maz-btn--ghost" style="padding:1px 6px;font-size:10px" (click)="toggleStudents(cls.id)">بستن ▲</button>
              </div>
              @for (sa of cls.studentAssignments ?? []; track sa.id) {
                <div class="student-row">
                  <span class="gender-dot" [class.male]="sa.student.gender==='MALE'" [class.female]="sa.student.gender==='FEMALE'"></span>
                  <span class="s-name">{{ sa.student.firstName }} {{ sa.student.lastName }}</span>
                  <span class="s-grade">{{ sa.grade?.label }}</span>
                  <a [routerLink]="['/students', sa.student.id]" class="maz-btn maz-btn--sm maz-btn--ghost" style="padding:2px 6px;font-size:10px">←</a>
                </div>
              }
              @if (!(cls.studentAssignments?.length)) {
                <div style="padding:10px 15px;font-size:12px;color:var(--maz-gray-400)">هنوز دانش‌آموزی تخصیص نیافته</div>
              }
            </div>
          } @else {
            <div style="padding:6px 15px">
              <button class="maz-btn maz-btn--sm maz-btn--ghost" style="font-size:11px" (click)="toggleStudents(cls.id)">مشاهده دانش‌آموزان ▼</button>
            </div>
          }

          <!-- Teacher assignment panel -->
          <div class="teacher-panel">
            <div class="teacher-label">معلم / دبیر</div>
            @for (ta of cls.teacherAssignments; track ta.id) {
              <div class="teacher-row">
                <span class="teacher-name">{{ ta.user.firstName }} {{ ta.user.lastName }}</span>
                @if (ta.subject) { <span style="font-size:10px;color:var(--maz-gray-400)">{{ ta.subject.label }}</span> }
                <button class="rm-btn" title="حذف" (click)="removeTeacher(cls, ta.id)">✕</button>
              </div>
            }
            @if (expandedTeacher().has(cls.id)) {
              <div class="assign-row">
                <select [(ngModel)]="teacherInputs[cls.id + '_user']" style="flex:1">
                  <option value="">انتخاب معلم / دبیر</option>
                  @for (t of teachers(); track t.id) {
                    <option [value]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
                  }
                </select>
                <button class="maz-btn maz-btn--sm maz-btn--primary" (click)="assignTeacher(cls)">تخصیص</button>
                <button class="maz-btn maz-btn--sm maz-btn--ghost" (click)="toggleTeacher(cls.id)">انصراف</button>
              </div>
            } @else {
              <button class="maz-btn maz-btn--sm maz-btn--ghost" style="font-size:11px;margin-top:4px" (click)="toggleTeacher(cls.id)">+ افزودن معلم</button>
            }
          </div>

          <!-- Phantom students -->
          <div class="phantom-section">
            <div class="phantom-title">👻 دانش‌آموزان فرضی (تخمین ظرفیت)</div>
            @for (p of cls._phantoms ?? []; track p.id) {
              <div class="phantom-row">
                <span class="phantom-name">{{ p.name }}</span>
                <span style="font-size:10px;color:var(--maz-gray-400)">{{ gradeLabel(p.gradeId, cls) }}</span>
                <button class="rm-btn" (click)="removePhantom(cls, p.id)">✕</button>
              </div>
            }
            <div class="add-phantom">
              <input placeholder="نام (اختیاری)" [(ngModel)]="phantomInputs[cls.id+'_n']" (keydown.enter)="addPhantom(cls)" />
              <select [(ngModel)]="phantomInputs[cls.id+'_g']">
                <option value="">پایه</option>
                @for (cg of cls.classGrades; track cg.grade.id) {
                  <option [value]="cg.grade.id">{{ cg.grade.label }}</option>
                }
              </select>
              <button class="maz-btn maz-btn--sm maz-btn--ghost" (click)="addPhantom(cls)">+</button>
            </div>
            @if ((cls._phantoms?.length ?? 0) > 0) {
              <div class="cap-hint">ظرفیت تخمینی: {{ activeStudentCount(cls) + (cls._phantoms?.length ?? 0) }} نفر</div>
            }
          </div>
        </div>
      }

      @if (!loading() && !classes().length) {
        <div class="maz-card" style="text-align:center;padding:48px;color:var(--maz-gray-400)">
          هنوز کلاسی ثبت نشده — <a routerLink="/smart-class" style="color:var(--maz-firouzeh-600)">کلاسبندی هوشمند</a>
        </div>
      }
    </div>

    <!-- Edit modal -->
    @if (editingClass()) {
      <div class="modal-overlay" (click)="editingClass.set(null)">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-title">ویرایش کلاس</div>
          <div class="maz-form-field">
            <label class="maz-label">نام کلاس</label>
            <input class="maz-input" [(ngModel)]="editName" />
          </div>
          <div class="modal-actions">
            <button class="maz-btn maz-btn--primary" (click)="saveEdit()">ذخیره</button>
            <button class="maz-btn maz-btn--ghost" (click)="editingClass.set(null)">انصراف</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ClassesComponent implements OnInit {
  private http      = inject(HttpClient);
  private lookupsApi = inject(LookupsApi);
  readonly appState = inject(AppStateService);
  readonly auth     = inject(AuthService);
  private base      = environment.apiUrl;

  loading         = signal(true);
  classes         = signal<ClassRoom[]>([]);
  teachers        = signal<any[]>([]);
  showNew         = signal(false);
  expandedStudents = signal<Set<number>>(new Set());
  expandedTeacher = signal<Set<number>>(new Set());
  editingClass    = signal<ClassRoom | null>(null);

  newName = ''; newCapacity: number | null = null;
  editName = '';
  teacherInputs: Record<string, any> = {};
  phantomInputs: Record<string, any> = {};

  ngOnInit() { this.load(); this.loadTeachers(); }

  load() {
    this.loading.set(true);
    const centerId = this.auth.isSuperuser() ? undefined : this.auth.centerIds()[0];
    const yearId   = this.appState.activeYearId();
    const body: any = { page: 1, pageSize: 200 };
    if (centerId) body.centerId = centerId;
    if (yearId)   body.academicYearId = yearId;

    this.http.post<any>(`${this.base}/classes/list`, body).subscribe({
      next: r => {
        this.classes.set((r.data ?? r).map((c: any) => ({ ...c, _phantoms: [] })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTeachers() {
    this.http.post<any>(`${this.base}/users/list`, {
      page: 1, pageSize: 200,
      filters: [{ field: 'isActive', fieldType: 'boolean', operator: 'is_true', order: 1 }],
    }).subscribe({
      next: r => this.teachers.set((r.data ?? []).filter((u: any) =>
        ['TEACHER', 'STAFF'].includes(u.userType)
      )),
      error: () => {},
    });
  }

  createClass() {
    if (!this.newName) return;
    const centerId = this.auth.centerIds()[0];
    const yearId   = this.appState.activeYearId();
    const body: any = { name: this.newName };
    if (centerId) body.centerId = centerId;
    if (yearId)   body.academicYearId = yearId;
    if (this.newCapacity) body.capacity = this.newCapacity;

    this.http.post<any>(`${this.base}/classes`, body).subscribe({
      next: () => { this.newName = ''; this.newCapacity = null; this.showNew.set(false); this.load(); },
      error: e => alert(e.error?.message ?? 'خطا در ثبت'),
    });
  }

  deleteClass(cls: ClassRoom) {
    if (!confirm(`کلاس «${cls.name}» حذف شود؟`)) return;
    this.http.delete(`${this.base}/classes/${cls.id}`).subscribe({
      next: () => this.load(),
      error: e => alert(e.error?.message ?? 'خطا در حذف'),
    });
  }

  openEdit(cls: ClassRoom) { this.editingClass.set(cls); this.editName = cls.name; }
  saveEdit() {
    const cls = this.editingClass();
    if (!cls) return;
    this.http.patch(`${this.base}/classes/${cls.id}`, { name: this.editName }).subscribe({
      next: () => { this.editingClass.set(null); this.load(); },
      error: e => alert(e.error?.message ?? 'خطا'),
    });
  }

  toggleStudents(id: number) {
    const cls = this.classes().find(c => c.id === id);
    if (!cls?.studentAssignments && !this.expandedStudents().has(id)) {
      // load students for this class
      this.http.get<any>(`${this.base}/classes/${id}`).subscribe({
        next: full => {
          this.classes.update(list => list.map(c => c.id === id
            ? { ...c, studentAssignments: full.studentAssignments ?? [] }
            : c
          ));
          this.expandedStudents.update(s => { const n = new Set(s); n.add(id); return n; });
        },
      });
    } else {
      this.expandedStudents.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
  }

  toggleTeacher(id: number) {
    this.expandedTeacher.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  assignTeacher(cls: ClassRoom) {
    const userId = this.teacherInputs[cls.id + '_user'];
    if (!userId) return;
    this.http.post(`${this.base}/classes/${cls.id}/teachers`, { userId: Number(userId) }).subscribe({
      next: () => { this.teacherInputs[cls.id + '_user'] = ''; this.load(); this.expandedTeacher.update(s => { const n = new Set(s); n.delete(cls.id); return n; }); },
      error: e => alert(e.error?.message ?? 'خطا'),
    });
  }

  removeTeacher(cls: ClassRoom, assignmentId: number) {
    if (!confirm('تخصیص معلم لغو شود؟')) return;
    this.http.delete(`${this.base}/classes/teacher-assignments/${assignmentId}`).subscribe({
      next: () => this.load(),
      error: e => alert(e.error?.message ?? 'خطا'),
    });
  }

  addPhantom(cls: ClassRoom) {
    const name  = this.phantomInputs[cls.id+'_n'] || `فرضی ${(cls._phantoms?.length ?? 0)+1}`;
    const grade = this.phantomInputs[cls.id+'_g'] ? Number(this.phantomInputs[cls.id+'_g']) : null;
    this.classes.update(l => l.map(c => c.id === cls.id
      ? { ...c, _phantoms: [...(c._phantoms??[]), { id: Date.now().toString(), name, gradeId: grade }] }
      : c
    ));
    this.phantomInputs[cls.id+'_n'] = ''; this.phantomInputs[cls.id+'_g'] = '';
  }

  removePhantom(cls: ClassRoom, pid: string) {
    this.classes.update(l => l.map(c => c.id === cls.id
      ? { ...c, _phantoms: (c._phantoms??[]).filter(p => p.id !== pid) }
      : c
    ));
  }

  activeStudentCount(cls: ClassRoom): number {
    return cls.studentAssignments?.length ?? cls._studentCount ?? 0;
  }

  gradeLabel(gradeId: number | null, cls: ClassRoom): string {
    if (!gradeId) return '';
    return cls.classGrades.find(g => g.grade.id === gradeId)?.grade.label ?? '';
  }
}
