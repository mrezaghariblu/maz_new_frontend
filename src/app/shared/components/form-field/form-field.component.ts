import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'maz-form-field',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .field { margin-bottom: 18px; }
    .label {
      display: block; font-size: 12px; font-weight: 700;
      color: var(--maz-gray-600); margin-bottom: 7px;
    }
    .required { color: var(--maz-danger); margin-right: 2px; }
    .hint { font-size: 11px; color: var(--maz-gray-400); margin-top: 5px; }
    .error { font-size: 11px; color: var(--maz-danger); margin-top: 5px; }
  `],
  template: `
    <div class="field">
      @if (label) {
        <label class="label">
          @if (required) { <span class="required">*</span> }
          {{ label }}
        </label>
      }
      <ng-content />
      @if (hint && !showError()) {
        <div class="hint">{{ hint }}</div>
      }
      @if (showError()) {
        <div class="error">{{ errorMessage() }}</div>
      }
    </div>
  `,
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() required = false;
  @Input() control: AbstractControl | null = null;
  @Input() hint = '';

  showError(): boolean {
    return !!(this.control && this.control.invalid && this.control.touched);
  }

  errorMessage(): string {
    if (!this.control?.errors) return '';
    if (this.control.errors['required']) return 'این فیلد الزامی است';
    if (this.control.errors['minlength']) return `حداقل ${this.control.errors['minlength'].requiredLength} کاراکتر`;
    if (this.control.errors['pattern']) return 'فرمت نامعتبر است';
    return 'مقدار نامعتبر';
  }
}
