import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusBadgeVariant =
  | 'active' | 'inactive' | 'default' | 'warning' | 'info' | 'danger' | 'success';

@Component({
  selector: 'maz-status-badge',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700; white-space: nowrap;
    }
    .badge--active   { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge--inactive { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
    .badge--default  { background: var(--maz-firouzeh-50); color: var(--maz-firouzeh-800); border: 1px solid var(--maz-firouzeh-200); }
    .badge--warning  { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge--info     { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge--danger   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge--success  { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
  `],
  template: `<span class="badge badge--{{ variant }}">{{ label }}</span>`,
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() variant: StatusBadgeVariant = 'default';
}

export function personnelStatusVariant(code: string): StatusBadgeVariant {
  const map: Record<string, StatusBadgeVariant> = {
    ACTIVE:      'active',
    ON_LEAVE:    'warning',
    SUSPENDED:   'danger',
    RETIRED:     'inactive',
    TRANSFERRED: 'info',
    DISMISSED:   'danger',
  };
  return map[code] ?? 'default';
}
