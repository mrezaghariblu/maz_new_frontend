// src/app/core/auth/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthResponse, JwtClaims, LoginRequest, UserType } from '../models/index';

const ACCESS_KEY  = 'maz_access';
const REFRESH_KEY = 'maz_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  // ─── Signals ───────────────────────────────────────────────
  private _claims = signal<JwtClaims | null>(this.decodeStored());

  readonly isLoggedIn  = computed(() => !!this._claims());
  readonly currentUser = computed(() => this._claims());
  readonly userType    = computed(() => this._claims()?.type ?? null);
  readonly isSuperuser = computed(() => this._claims()?.type === 'SUPERUSER');
  readonly centerIds   = computed(() => this._claims()?.centerIds ?? []);

  constructor(private http: HttpClient, private router: Router) {}

  // ─── Login ─────────────────────────────────────────────────
  login(dto: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, dto).pipe(
      tap(res => this.storeTokens(res)),
      catchError(err => throwError(() => err)),
    );
  }

  // ─── Logout ────────────────────────────────────────────────
  logout() {
    this.http.post(`${this.api}/auth/logout`, {}).subscribe();
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  // ─── Refresh ───────────────────────────────────────────────
  refresh() {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return throwError(() => new Error('no refresh token'));

    return this.http.post<AuthResponse>(`${this.api}/auth/refresh`, { refreshToken }).pipe(
      tap(res => this.storeTokens(res)),
    );
  }

  // ─── Token management ──────────────────────────────────────
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  isTokenExpired(): boolean {
    const claims = this._claims();
    if (!claims) return true;
    return Date.now() / 1000 > claims.exp - 30; // 30s buffer
  }

  private storeTokens(res: AuthResponse) {
    localStorage.setItem(ACCESS_KEY,  res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this._claims.set(this.decodeToken(res.accessToken));
  }

  private clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._claims.set(null);
  }

  private decodeStored(): JwtClaims | null {
    const token = localStorage.getItem(ACCESS_KEY);
    return token ? this.decodeToken(token) : null;
  }

  private decodeToken(token: string): JwtClaims | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as JwtClaims;
    } catch { return null; }
  }

  // ─── Permission helpers ────────────────────────────────────
  canAccessCenter(centerId: number): boolean {
    if (this.isSuperuser()) return true;
    return this.centerIds().includes(centerId);
  }

  hasRole(...roles: UserType[]): boolean {
    const t = this.userType();
    return t ? roles.includes(t) : false;
  }
}