// src/app/features/smart-class/smart-class.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SmartClassApi, CentersApi } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { catchError, of } from 'rxjs';

type Step = 'idle' | 'generating' | 'review' | 'confirming' | 'done';

interface Student { id: number; firstName: string; lastName: string; gender: string; gradeLabel: string; disabilityCodes: string[]; isMultiple: boolean; }
interface ProposedClass {
  suggestedName: string; gradeIds: number[]; gradeLabels: string[]; track: string;
  educationLevelCode: string; capacityRule: { min: number; max: number };
  students: Student[]; studentCount: number; isValid: boolean; warnings: string[];
  isMultiGrade: boolean; isMultiDisability: boolean;
  // ویرایش توسط مدیر
  editedName?: string;
  excluded?: Set<number>;
}

@Component({
  selector: 'maz-smart-class',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    /* ─── Stepper ─── */
    .stepper { display:flex; align-items:center; gap:0; margin-bottom:28px; }
    .step { display:flex; align-items:center; gap:8px; }
    .step-num {
      width:28px; height:28px; border-radius:50%; border:2px solid var(--maz-border);
      font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center;
      background:#fff; color:var(--maz-gray-400); flex-shrink:0; transition:all .2s;
    }
    .step.active .step-num  { border-color:var(--maz-firouzeh-500); color:var(--maz-firouzeh-600); background:var(--maz-firouzeh-50); }
    .step.done .step-num    { border-color:var(--maz-firouzeh-500); background:var(--maz-firouzeh-500); color:#fff; }
    .step-label { font-size:12px; font-weight:700; color:var(--maz-gray-400); }
    .step.active .step-label { color:var(--maz-firouzeh-700); }
    .step.done .step-label   { color:var(--maz-firouzeh-600); }
    .step-line { flex:1; height:2px; background:var(--maz-border); margin:0 8px; min-width:24px; }
    .step-line.done { background:var(--maz-firouzeh-400); }

    /* ─── Summary cards ─── */
    .summary-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
    .sum-card { padding:14px 16px; border-radius:var(--maz-radius-md); background:#fff; border:1px solid var(--maz-border); min-width:120px; }
    .sum-val { font-size:22px; font-weight:900; color:var(--maz-firouzeh-800); }
    .sum-val.warn  { color:#d97706; }
    .sum-val.ok    { color:#059669; }
    .sum-val.error { color:#dc2626; }
    .sum-lbl { font-size:11px; color:var(--maz-gray-500); margin-top:2px; font-weight:600; }

    /* ─── Class cards ─── */
    .classes-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px,1fr)); gap:16px; margin-bottom:20px; }
    .class-card { background:#fff; border-radius:var(--maz-radius-lg); border:1.5px solid var(--maz-border); overflow:hidden; transition:box-shadow .15s; }
    .class-card.valid   { border-color:#10b981; }
    .class-card.warning { border-color:#f59e0b; }
    .class-card.invalid { border-color:#ef4444; }
    .class-card:hover { box-shadow:0 4px 16px rgba(30,154,164,.1); }

    .card-header { padding:13px 15px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .card-header.valid   { background:#ecfdf5; }
    .card-header.warning { background:#fffbeb; }
    .card-header.invalid { background:#fef2f2; }
    .class-name-input {
      font-family:var(--maz-font); font-size:13px; font-weight:800; background:transparent;
      border:none; border-bottom:1.5px dashed transparent; padding:2px 4px; border-radius:4px;
      color:var(--maz-firouzeh-900); flex:1; min-width:0;
    }
    .class-name-input:focus { outline:none; border-bottom-color:var(--maz-firouzeh-400); background:#fff; }
    .class-status { font-size:10px; font-weight:700; padding:3px 8px; border-radius:8px; white-space:nowrap; flex-shrink:0; }
    .class-status.valid   { background:#d1fae5; color:#065f46; }
    .class-status.warning { background:#fef3c7; color:#92400e; }
    .class-status.invalid { background:#fee2e2; color:#991b1b; }

    .card-meta { padding:10px 15px 0; display:flex; gap:6px; flex-wrap:wrap; }
    .meta-chip { padding:3px 9px; border-radius:10px; font-size:11px; font-weight:700; }
    .meta-chip.track-ia  { background:var(--maz-firouzeh-50); color:var(--maz-firouzeh-800); }
    .meta-chip.track-sm  { background:#ede9fe; color:#5b21b6; }
    .meta-chip.track-n   { background:#f0f9ff; color:#0369a1; }
    .meta-chip.multi-g   { background:#fef3c7; color:#92400e; }
    .meta-chip.multi-d   { background:#fce7f3; color:#9d174d; }
    .meta-chip.cap       { background:var(--maz-gray-100); color:var(--maz-gray-600); }

    .card-warnings { padding:8px 15px; }
    .warn-item { font-size:11px; color:#d97706; display:flex; align-items:flex-start; gap:5px; margin-bottom:3px; }

    .card-students { padding:10px 15px 14px; }
    .students-title { font-size:11px; font-weight:800; color:var(--maz-gray-500); margin-bottom:7px; display:flex; align-items:center; justify-content:space-between; }
    .student-row {
      display:flex; align-items:center; gap:8px; padding:5px 8px; border-radius:6px;
      font-size:12px; margin-bottom:3px; background:var(--maz-gray-50);
    }
    .student-row.excluded { opacity:.4; text-decoration:line-through; background:#fee2e2; }
    .student-name { flex:1; font-weight:600; }
    .student-grade { font-size:10px; color:var(--maz-gray-400); }
    .d-tags { display:flex; gap:3px; flex-wrap:wrap; }
    .d-tag { padding:1px 5px; border-radius:5px; font-size:10px; background:var(--maz-firouzeh-50); color:var(--maz-firouzeh-700); font-weight:600; }
    .d-tag.multi { background:#fce7f3; color:#9d174d; }
    .exclude-btn { background:none; border:none; cursor:pointer; color:var(--maz-gray-400); font-size:13px; padding:2px; border-radius:3px; font-family:var(--maz-font); }
    .exclude-btn:hover { color:#dc2626; background:#fee2e2; }
    .include-btn { background:none; border:none; cursor:pointer; color:#059669; font-size:11px; padding:2px 5px; border-radius:3px; font-family:var(--maz-font); font-weight:700; }

    /* ─── Unplaced students ─── */
    .unplaced-panel { background:#fff; border:1.5px solid #f59e0b; border-radius:var(--maz-radius-lg); padding:16px; margin-bottom:20px; }
    .unplaced-title { font-size:13px; font-weight:800; color:#92400e; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    .unplaced-list { display:flex; flex-wrap:wrap; gap:6px; }
    .unplaced-chip { padding:5px 10px; border-radius:8px; font-size:12px; background:#fef3c7; color:#92400e; font-weight:600; }

    /* ─── Done state ─── */
    .done-card { text-align:center; padding:48px 24px; }
    .done-icon { font-size:56px; margin-bottom:16px; }
    .done-title { font-size:20px; font-weight:900; color:var(--maz-firouzeh-900); margin-bottom:8px; }
    .done-sub { font-size:13px; color:var(--maz-gray-500); margin-bottom:24px; }
  `],
  template: `
    <div class="maz-page-header">
      <div class="maz-page-header__title">کلاسبندی هوشمند</div>
      <div class="maz-page-header__sub">پیشنهاد خودکار بر اساس جدول شماره ۲ آیین‌نامه</div>
    </div>

    <!-- Stepper -->
    <div class="stepper">
      <div class="step" [class.active]="step()==='idle'||step()==='generating'" [class.done]="stepNum()>0">
        <div class="step-num">{{ stepNum()>0 ? '✓' : '۱' }}</div>
        <div class="step-label">تولید پیشنهاد</div>
      </div>
      <div class="step-line" [class.done]="stepNum()>=1"></div>
      <div class="step" [class.active]="step()==='review'" [class.done]="stepNum()>1">
        <div class="step-num">{{ stepNum()>1 ? '✓' : '۲' }}</div>
        <div class="step-label">بررسی و ویرایش</div>
      </div>
      <div class="step-line" [class.done]="stepNum()>=2"></div>
      <div class="step" [class.active]="step()==='confirming'||step()==='done'" [class.done]="step()==='done'">
        <div class="step-num">{{ step()==='done' ? '✓' : '۳' }}</div>
        <div class="step-label">تأیید نهایی</div>
      </div>
    </div>

    <!-- ─── Step 1: Generate ─── -->
    @if (step()==='idle' || step()==='generating') {
      <div class="maz-card" style="max-width:480px">
        <div style="font-size:15px;font-weight:800;color:var(--maz-firouzeh-900);margin-bottom:16px">
          📋 پارامترهای کلاسبندی
        </div>

        @if (auth.isSuperuser()) {
          <div class="maz-form-field">
            <label class="maz-label">مرکز آموزشی</label>
            <select class="maz-select" [(ngModel)]="selectedCenterId">
              <option [ngValue]="null">انتخاب کنید...</option>
              @for (c of centers(); track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
        }

        <div class="maz-form-field" style="margin-top:12px">
          <label class="maz-label">سال تحصیلی</label>
          <select class="maz-select" [(ngModel)]="selectedYearId">
            <option [ngValue]="null">انتخاب کنید...</option>
            @for (y of appState.years(); track y.id) {
              <option [ngValue]="y.id">{{ y.label }}</option>
            }
          </select>
        </div>

        <div style="margin-top:16px;padding:12px;background:var(--maz-firouzeh-50);border-radius:8px;font-size:12px;color:var(--maz-firouzeh-800)">
          <strong>الگوریتم بر اساس:</strong> جدول شماره ۲ آیین‌نامه — گروه استثنایی، مقطع تحصیلی، حداقل و حداکثر دانش‌آموز
        </div>

        <button class="maz-btn maz-btn--primary"
          style="margin-top:16px;width:100%"
          [disabled]="!canGenerate() || step()==='generating'"
          (click)="generate()">
          @if (step()==='generating') {
            <span class="maz-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-left:6px"></span>
            در حال تحلیل دانش‌آموزان...
          } @else {
            🤖 تولید پیشنهاد کلاسبندی
          }
        </button>
      </div>
    }

    <!-- ─── Step 2: Review ─── -->
    @if (step()==='review' && proposal()) {
      <!-- Summary -->
      <div class="summary-row">
        <div class="sum-card">
          <div class="sum-val">{{ proposal()!.totalUnassigned }}</div>
          <div class="sum-lbl">دانش‌آموز کلاسبندی‌نشده</div>
        </div>
        <div class="sum-card">
          <div class="sum-val ok">{{ proposal()!.summary.totalProposedClasses }}</div>
          <div class="sum-lbl">کلاس پیشنهادی</div>
        </div>
        <div class="sum-card">
          <div class="sum-val ok">{{ proposal()!.summary.validClasses }}</div>
          <div class="sum-lbl">کلاس معتبر</div>
        </div>
        @if (proposal()!.summary.warningClasses > 0) {
          <div class="sum-card">
            <div class="sum-val warn">{{ proposal()!.summary.warningClasses }}</div>
            <div class="sum-lbl">دارای هشدار</div>
          </div>
        }
        @if (proposal()!.summary.totalUnplaced > 0) {
          <div class="sum-card">
            <div class="sum-val error">{{ proposal()!.summary.totalUnplaced }}</div>
            <div class="sum-lbl">جایگذاری‌نشده</div>
          </div>
        }
      </div>

      <!-- Unplaced warning -->
      @if (proposal()!.unplacedStudents.length > 0) {
        <div class="unplaced-panel">
          <div class="unplaced-title">
            ⚠️ دانش‌آموزان جایگذاری‌نشده
            <span style="font-size:11px;font-weight:400">— نیاز به تصمیم دستی دارند</span>
          </div>
          <div class="unplaced-list">
            @for (s of proposal()!.unplacedStudents; track s.id) {
              <span class="unplaced-chip">{{ s.firstName }} {{ s.lastName }} ({{ s.gradeLabel }})</span>
            }
          </div>
        </div>
      }

      <!-- Class cards -->
      <div class="classes-grid">
        @for (cls of editableClasses(); track $index; let i = $index) {
          <div class="class-card" [class.valid]="cls.isValid && !cls.warnings.length" [class.warning]="cls.warnings.length > 0 && cls.isValid" [class.invalid]="!cls.isValid">
            <div class="card-header" [class.valid]="cls.isValid && !cls.warnings.length" [class.warning]="cls.warnings.length > 0 && cls.isValid" [class.invalid]="!cls.isValid">
              <input class="class-name-input" [(ngModel)]="cls.editedName" [placeholder]="cls.suggestedName" />
              <span class="class-status" [class.valid]="cls.isValid && !cls.warnings.length" [class.warning]="cls.warnings.length>0&&cls.isValid" [class.invalid]="!cls.isValid">
                {{ cls.isValid && !cls.warnings.length ? '✓ معتبر' : cls.warnings.length ? '⚠ هشدار' : '✗ نامعتبر' }}
              </span>
            </div>

            <div class="card-meta">
              <span class="meta-chip" [class.track-ia]="cls.track==='INTELLECTUAL_AUTISM'" [class.track-sm]="cls.track==='SENSORY_MOTOR'" [class.track-n]="cls.track==='NORMAL'">
                {{ trackLabel(cls.track) }}
              </span>
              @if (cls.isMultiGrade) { <span class="meta-chip multi-g">چندپایه</span> }
              @if (cls.isMultiDisability) { <span class="meta-chip multi-d">چندمعلولیتی</span> }
              <span class="meta-chip cap">{{ activeCount(cls) }}/{{ cls.capacityRule.max }} نفر</span>
              <span class="meta-chip cap" style="background:#e0f2fe;color:#0369a1">
                حداقل {{ cls.capacityRule.min }} نفر
              </span>
            </div>

            @if (cls.warnings.length) {
              <div class="card-warnings">
                @for (w of cls.warnings; track w) {
                  <div class="warn-item">⚠ {{ w }}</div>
                }
              </div>
            }

            <div class="card-students">
              <div class="students-title">
                <span>دانش‌آموزان</span>
                <span style="color:var(--maz-firouzeh-600);font-size:10px">
                  {{ activeCount(cls) }} فعال / {{ (cls.excluded?.size ?? 0) }} حذف‌شده
                </span>
              </div>
              @for (s of cls.students; track s.id) {
                <div class="student-row" [class.excluded]="cls.excluded?.has(s.id)">
                  <span class="student-name">{{ s.firstName }} {{ s.lastName }}</span>
                  <span class="student-grade">{{ s.gradeLabel }}</span>
                  <div class="d-tags">
                    @for (code of s.disabilityCodes.slice(0,2); track code) {
                      <span class="d-tag" [class.multi]="s.isMultiple">{{ shortCode(code) }}</span>
                    }
                  </div>
                  @if (!cls.excluded?.has(s.id)) {
                    <button class="exclude-btn" title="حذف از این کلاس" (click)="excludeStudent(cls, s.id)">✕</button>
                  } @else {
                    <button class="include-btn" (click)="includeStudent(cls, s.id)">↩</button>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="maz-btn maz-btn--primary" (click)="confirm()" [disabled]="step()==='confirming'">
          @if (step()==='confirming') {
            <span class="maz-spinner" style="width:13px;height:13px;border-width:2px;display:inline-block;margin-left:6px"></span>
          }
          ✅ تأیید و ایجاد کلاس‌ها
        </button>
        <button class="maz-btn maz-btn--ghost" (click)="reset()">← شروع مجدد</button>
      </div>
    }

    <!-- ─── Step 3: Done ─── -->
    @if (step()==='done' && confirmResult()) {
      <div class="maz-card done-card">
        <div class="done-icon">🎉</div>
        <div class="done-title">کلاسبندی با موفقیت انجام شد</div>
        <div class="done-sub">
          {{ confirmResult()!.created }} کلاس ایجاد شد و {{ confirmResult()!.totalAssigned }} دانش‌آموز تخصیص یافتند
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a class="maz-btn maz-btn--primary" routerLink="/classes">مشاهده کلاس‌ها</a>
          <button class="maz-btn maz-btn--ghost" (click)="reset()">کلاسبندی جدید</button>
        </div>
      </div>
    }
  `,
})
export class SmartClassComponent implements OnInit {
  private api        = inject(SmartClassApi);
  private centersApi = inject(CentersApi);
  readonly appState = inject(AppStateService);
  readonly auth     = inject(AuthService);

  step          = signal<Step>('idle');
  centers       = signal<any[]>([]);
  proposal      = signal<any | null>(null);
  editableClasses = signal<any[]>([]);
  confirmResult = signal<any | null>(null);

  selectedCenterId: number | null = null;
  selectedYearId: number | null   = null;

  stepNum = computed(() => {
    const s = this.step();
    if (s === 'idle' || s === 'generating') return 0;
    if (s === 'review') return 1;
    return 2;
  });

  ngOnInit() {
    this.selectedYearId   = this.appState.activeYearId() ?? null;
    this.selectedCenterId = this.auth.centerIds()[0] ?? null;
    if (this.auth.isSuperuser()) {
      this.centersApi.list({ page: 1, pageSize: 200 }).subscribe({
        next: r => this.centers.set((r as any).data ?? []),
        error: () => {},
      });
    }
  }

  canGenerate() {
    return this.selectedYearId && this.selectedCenterId;
  }

  generate() {
    const centerId = this.selectedCenterId ?? this.auth.centerIds()[0];
    if (!centerId || !this.selectedYearId) return;

    this.step.set('generating');

    this.api.generate(centerId, this.selectedYearId)
      .pipe(catchError(e => { alert(e.error?.message ?? 'خطا'); this.step.set('idle'); return of(null); }))
      .subscribe(r => {
        if (!r) return;
        this.proposal.set(r);
        // اضافه کردن excluded set به هر کلاس
        this.editableClasses.set(
          r.proposedClasses.map((c: any) => ({ ...c, editedName: c.suggestedName, excluded: new Set<number>() }))
        );
        this.step.set('review');
      });
  }

  confirm() {
    const centerId = this.selectedCenterId ?? this.auth.centerIds()[0];
    if (!centerId || !this.selectedYearId) return;

    this.step.set('confirming');
    const classes = this.editableClasses().map(cls => ({
      name: cls.editedName || cls.suggestedName,
      gradeIds: cls.gradeIds,
      studentIds: cls.students.filter((s: any) => !cls.excluded?.has(s.id)).map((s: any) => s.id),
    })).filter(c => c.studentIds.length > 0);

    this.api.confirm(centerId, this.selectedYearId!, classes)
      .pipe(catchError(e => { alert(e.error?.message ?? 'خطا در تأیید'); this.step.set('review'); return of(null); }))
      .subscribe(r => {
        if (!r) return;
        this.confirmResult.set(r);
        this.step.set('done');
      });
  }

  reset() {
    this.step.set('idle');
    this.proposal.set(null);
    this.editableClasses.set([]);
    this.confirmResult.set(null);
  }

  excludeStudent(cls: any, studentId: number) {
    cls.excluded = new Set(cls.excluded);
    cls.excluded.add(studentId);
    this.editableClasses.update(l => [...l]);
  }

  includeStudent(cls: any, studentId: number) {
    cls.excluded = new Set(cls.excluded);
    cls.excluded.delete(studentId);
    this.editableClasses.update(l => [...l]);
  }

  activeCount(cls: any): number {
    return cls.students.filter((s: any) => !cls.excluded?.has(s.id)).length;
  }

  trackLabel(track: string): string {
    return { INTELLECTUAL_AUTISM: 'ذهنی-اتیسم', SENSORY_MOTOR: 'حسی-حرکتی', NORMAL: 'عادی' }[track] ?? track;
  }

  shortCode(code: string): string {
    return {
      INTELLECTUAL: 'ذهنی', AUTISM: 'اتیسم', HEARING: 'شنوایی',
      VISUAL: 'بینایی', PHYSICAL_MOTOR: 'جسمی', EMOTIONAL_BEHAVIORAL: 'هیجانی',
    }[code] ?? code;
  }
}
