// src/app/core/services/api.service.ts
// سرویس پایه — همه سرویس‌های دیگر از این extend می‌کنند
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  SmartFilterRequest, PagedResult, ExcelExportRequest,
  AcademicYear, Center, User, Student, StatusType,
  PersonnelStatusHistory, StudentStatusHistory, CenterStatusHistory,
  AuditLog,
} from '../models/index';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly base = environment.apiUrl;
  constructor(protected http: HttpClient) {}
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AcademicYearsApi extends ApiService {
  private url = `${this.base}/academic-years`;

  getAll()             { return this.http.get<AcademicYear[]>(this.url); }
  getActive()          { return this.http.get<AcademicYear>(`${this.url}/active`); }
  create(d: Partial<AcademicYear>) { return this.http.post<AcademicYear>(this.url, d); }
  update(id: number, d: Partial<AcademicYear>) { return this.http.patch<AcademicYear>(`${this.url}/${id}`, d); }
  activate(id: number) { return this.http.patch<AcademicYear>(`${this.url}/${id}/activate`, {}); }
  archive(id: number)  { return this.http.patch<AcademicYear>(`${this.url}/${id}/archive`, {}); }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CentersApi extends ApiService {
  private url = `${this.base}/centers`;

  list(dto: SmartFilterRequest)    { return this.http.post<PagedResult<Center>>(`${this.url}/list`, dto); }
  getOne(id: number)               { return this.http.get<Center>(`${this.url}/${id}`); }
  create(d: Partial<Center>)       { return this.http.post<Center>(this.url, d); }
  update(id: number, d: Partial<Center>) { return this.http.patch<Center>(`${this.url}/${id}`, d); }
  deactivate(id: number)           { return this.http.delete<Center>(`${this.url}/${id}`); }

  exportExcel(dto: ExcelExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export/excel`, dto, { responseType: 'blob' });
  }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UsersApi extends ApiService {
  private url = `${this.base}/users`;

  list(dto: SmartFilterRequest)       { return this.http.post<PagedResult<User>>(`${this.url}/list`, dto); }
  getOne(id: number)                  { return this.http.get<User>(`${this.url}/${id}`); }
  create(d: Partial<User> & { password?: string }) { return this.http.post<User>(this.url, d); }
  update(id: number, d: Partial<User>) { return this.http.patch<User>(`${this.url}/${id}`, d); }
  changePassword(id: number, newPassword: string) {
    return this.http.patch(`${this.url}/${id}/password`, { newPassword });
  }
  assignCenter(id: number, d: { centerId: number; academicYearId: number; isPrimary?: boolean; note?: string }) {
    return this.http.post(`${this.url}/${id}/assign-center`, d);
  }
  transfer(id: number, d: { fromCenterId: number; toCenterId: number; academicYearId: number; note?: string }) {
    return this.http.post(`${this.url}/${id}/transfer`, d);
  }
  revokeAssignment(assignmentId: number) {
    return this.http.patch(`${this.url}/assignments/${assignmentId}/revoke`, {});
  }
  deactivate(id: number) { return this.http.delete(`${this.url}/${id}`); }

  exportExcel(dto: ExcelExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export/excel`, dto, { responseType: 'blob' });
  }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StudentsApi extends ApiService {
  private url = `${this.base}/students`;

  list(dto: SmartFilterRequest)       { return this.http.post<PagedResult<Student>>(`${this.url}/list`, dto); }
  getOne(id: number)                  { return this.http.get<Student>(`${this.url}/${id}`); }
  create(d: Partial<Student>)         { return this.http.post<Student>(this.url, d); }
  update(id: number, d: Partial<Student>) { return this.http.patch<Student>(`${this.url}/${id}`, d); }
  enroll(id: number, d: { centerId: number; academicYearId: number; grade: string; field?: string }) {
    return this.http.post(`${this.url}/${id}/enroll`, d);
  }
  deactivate(id: number) { return this.http.delete(`${this.url}/${id}`); }

  exportExcel(dto: ExcelExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export/excel`, dto, { responseType: 'blob' });
  }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StatusApi extends ApiService {
  private url = `${this.base}/status`;

  getTypes(target: 'PERSONNEL'|'STUDENT'|'CENTER') {
    return this.http.get<StatusType[]>(`${this.url}/types/${target}`);
  }
  createType(d: { target: string; code: string; label: string; sortOrder?: number }) {
    return this.http.post<StatusType>(`${this.url}/types`, d);
  }
  recordPersonnel(d: { entityId: number; statusTypeId: number; academicYearId: number; effectiveDate: string; note?: string }) {
    return this.http.post<PersonnelStatusHistory>(`${this.url}/personnel`, d);
  }
  recordStudent(d: { entityId: number; statusTypeId: number; academicYearId: number; effectiveDate: string; note?: string }) {
    return this.http.post<StudentStatusHistory>(`${this.url}/student`, d);
  }
  recordCenter(d: { entityId: number; statusTypeId: number; academicYearId: number; effectiveDate: string; note?: string }) {
    return this.http.post<CenterStatusHistory>(`${this.url}/center`, d);
  }
  getPersonnelHistory(userId: number, academicYearId?: number) {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return this.http.get<PersonnelStatusHistory[]>(`${this.url}/personnel/${userId}/history${params}`);
  }
  getStudentHistory(studentId: number, academicYearId?: number) {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return this.http.get<StudentStatusHistory[]>(`${this.url}/student/${studentId}/history${params}`);
  }
  getCenterHistory(centerId: number, academicYearId?: number) {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return this.http.get<CenterStatusHistory[]>(`${this.url}/center/${centerId}/history${params}`);
  }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuditApi extends ApiService {
  private url = `${this.base}/audit`;

  list(dto: SmartFilterRequest)    { return this.http.post<PagedResult<AuditLog>>(`${this.url}/list`, dto); }
  summary(academicYearId: number)  { return this.http.get<unknown>(`${this.url}/summary/${academicYearId}`); }
}