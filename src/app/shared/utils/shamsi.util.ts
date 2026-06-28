// src/app/shared/utils/shamsi.util.ts
// تبدیل جلالی ↔ میلادی (الگوریتم سبک‌وزن بدون وابستگی خارجی)

const MONTHS_FA = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function toJdn(jy: number, jm: number, jd: number): number {
  const epbase = jy - (jy >= 0 ? 474 : 473);
  const epyear = 474 + (epbase % 2820);
  return (
    jd +
    (jm <= 6 ? (jm - 1) * 31 : (jm - 1) * 30 + 6) +
    Math.floor((epyear * 682 - 110) / 2816) +
    (epyear - 1) * 365 +
    Math.floor(epbase / 2820) * 1029983 +
    1948319.5
  );
}

function fromJdn(jdn: number): [number, number, number] {
  const j = Math.floor(jdn) - 1948320 + 0.5;
  const n = Math.floor(j) % 1029983;
  const cycle = Math.floor(Math.floor(j) / 1029983);
  let ycycle: number;
  if (n === 1029982) {
    ycycle = 2820;
  } else {
    const aux1 = Math.floor(n / 366);
    const aux2 = n % 366;
    ycycle = Math.floor((2134 * aux1 + 2816 * aux2 + 2815) / 1028522) + aux1 + 1;
  }
  let jy = ycycle + 2820 * cycle + 474;
  if (jy <= 0) jy--;
  const yday = Math.floor(j) - Math.floor(toJdn(jy, 1, 1)) + 1;
  let jm: number;
  if (yday <= 186) jm = Math.ceil(yday / 31);
  else jm = Math.ceil((yday - 6) / 30);
  const jd = Math.floor(j) - Math.floor(toJdn(jy, jm, 1)) + 1;
  return [jy, jm, jd];
}

export function gregorianToShamsi(gy: number, gm: number, gd: number): [number, number, number] {
  const jdn = Math.floor((365.25 * (gy + 4716)) + Math.floor(30.6001 * (gm > 2 ? gm + 1 : gm + 13))
    + gd - 1524.5);
  return fromJdn(jdn);
}

export function shamsiToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const jdn = toJdn(jy, jm, jd);
  const z = Math.floor(jdn + 0.5);
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const gd = b - d - Math.floor(30.6001 * e);
  const gm = e < 14 ? e - 1 : e - 13;
  const gy = gm > 2 ? c - 4716 : c - 4715;
  return [gy, gm, gd];
}

export function formatShamsi(year?: number | null, month?: number | null, day?: number | null): string {
  if (!year) return '—';
  const y = String(year);
  const m = month ? String(month).padStart(2, '0') : '??';
  const d = day   ? String(day).padStart(2, '0')   : '??';
  return `${y}/${m}/${d}`;
}

export function todayShamsi(): [number, number, number] {
  const now = new Date();
  return gregorianToShamsi(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function shamsiYearRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => to - i);
}

export const SHAMSI_MONTHS = MONTHS_FA.map((label, i) => ({ value: i + 1, label }));

export function shamsiDaysInMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // اسفند: سال کبیسه بررسی ساده
  const [gy, gm] = shamsiToGregorian(year, 12, 29);
  const leap = new Date(gy, gm, 0).getDate() === 30; // تقریبی
  return leap ? 30 : 29;
}

export const DISABILITY_SEVERITY_LABEL: Record<string, string> = {
  MILD:     'خفیف',
  MODERATE: 'متوسط',
  SEVERE:   'شدید',
};