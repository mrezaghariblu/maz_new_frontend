/**
 * shamsi.util.ts
 * ابزار ساده برای تبدیل تاریخ شمسی ↔ میلادی
 * بدون کتابخانه‌ی خارجی — بر اساس الگوریتم ایرانی
 */

// ─── تبدیل جلالی به میلادی ────────────────────────────────────
export function shamsiToGregorian(jy: number, jm: number, jd: number): Date {
  let gy = jy <= 979 ? 1600 : 1976;
  jy -= jy <= 979 ? 0 : 979;
  let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4);
  for (let i = 0; i < jm - 1; i++) days += [31,31,31,31,31,31,30,30,30,30,30,29][i];
  days += jd - 1;
  let gd = days + 79;
  const g_d_no = gd % 365;
  gy += 400 * Math.floor(gd / 146097);
  gd = gd % 146097;
  let leap = true;
  if (gd >= 36525) { gd--; gy += 100 * Math.floor(gd / 36524); gd = gd % 36524; if (gd >= 365) gd++; else leap = false; }
  gy += 4 * Math.floor(gd / 1461); gd %= 1461;
  if (gd >= 366) { leap = false; gd--; gy += Math.floor(gd / 365); gd = gd % 365; }
  const gMonthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; i < 12; i++) { if (gd < gMonthDays[i]) { gm = i + 1; break; } gd -= gMonthDays[i]; }
  return new Date(gy, gm - 1, gd + 1);
}

// ─── تبدیل میلادی به جلالی ────────────────────────────────────
export function gregorianToShamsi(date: Date): { year: number; month: number; day: number } {
  const g_d_no = Math.floor((date.getTime() - new Date(1970, 0, 1).getTime()) / 86400000) + 2440587 - 2415021;
  const g_year = date.getFullYear(), g_month = date.getMonth() + 1, g_day = date.getDate();

  let jy = g_year - 1600; let gd = g_day; let gm = g_month; let gy = g_year;
  let gd2 = Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (gm + (gm <= 2 ? 13 : 1))) + gd - 1524;
  jy = Math.floor((gd2 - 1948320) / 365.25) - 79;
  if (jy <= 0) jy--;
  let jd2 = gd2 - Math.floor(365.25 * (jy + 6523));
  let jm = Math.floor(jd2 / 30.44);
  const jd = jd2 - Math.floor(30.44 * jm);
  if (jm > 6) jm--;
  return { year: jy + 1, month: jm, day: jd };
}

// ─── نمایش تاریخ شمسی ─────────────────────────────────────────
export function formatShamsi(year?: number | null, month?: number | null, day?: number | null): string {
  if (!year) return '—';
  const y = String(year);
  const m = month ? String(month).padStart(2, '0') : '??';
  const d = day   ? String(day).padStart(2, '0')   : '??';
  return `${y}/${m}/${d}`;
}

// ─── تبدیل سه فیلد شمسی به ISO برای ارسال به بک‌اند ──────────
export function shamsiFieldsToISO(year?: number, month?: number, day?: number): string | null {
  if (!year || !month || !day) return null;
  try {
    const d = shamsiToGregorian(year, month, day);
    return d.toISOString();
  } catch { return null; }
}

// ─── آرایه‌های dropdown ──────────────────────────────────────
export const SHAMSI_YEARS_RANGE = (from = 1320, to = 1415): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => to - i); // از جدید به قدیم

export const SHAMSI_MONTHS = [
  { value: 1,  label: 'فروردین' },
  { value: 2,  label: 'اردیبهشت' },
  { value: 3,  label: 'خرداد' },
  { value: 4,  label: 'تیر' },
  { value: 5,  label: 'مرداد' },
  { value: 6,  label: 'شهریور' },
  { value: 7,  label: 'مهر' },
  { value: 8,  label: 'آبان' },
  { value: 9,  label: 'آذر' },
  { value: 10, label: 'دی' },
  { value: 11, label: 'بهمن' },
  { value: 12, label: 'اسفند' },
];

export const DISABILITY_SEVERITY_LABEL: Record<string, string> = {
  MILD: 'خفیف', MODERATE: 'متوسط', SEVERE: 'شدید',
};

export const SHAMSI_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
