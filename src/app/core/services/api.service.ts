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
  AuditLog, LookupValue, LookupGroups,
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
  setCanLogin(id: number, d: { canLogin: boolean; password?: string }) { return this.http.patch(`${this.url}/${id}/can-login`, d); }
  deactivate(id: number)               { return this.http.delete<Center>(`${this.url}/${id}`); }

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
  create(d: Partial<User> & { password?: string; centerId?: number; academicYearId?: number }) { return this.http.post<User>(this.url, d); }
  update(id: number, d: Partial<User>) { return this.http.patch<User>(`${this.url}/${id}`, d); }
  changePassword(id: number, newPassword: string) {
    return this.http.patch(`${this.url}/${id}/password`, { newPassword });
  }
  setDisabilities(id: number, items: { disabilityTypeId: number; severity?: string; autismLevel?: number }[]) {
    return this.http.put(`${this.url}/${id}/disabilities`, { items });
  }
  assignCenter(id: number, d: { centerId: number; academicYearId: number; isPrimary?: boolean; note?: string }) {
    return this.http.post(`${this.url}/${id}/assign-center`, d);
  }
  transfer(id: number, d: { fromCenterId?: number; toCenterId: number; academicYearId: number; note?: string }) {
    return this.http.post(`${this.url}/${id}/transfer`, d);
  }
  revokeAssignment(assignmentId: number) {
    return this.http.patch(`${this.url}/assignments/${assignmentId}/revoke`, {});
  }
  setCanLogin(id: number, d: { canLogin: boolean; password?: string }) { return this.http.patch(`${this.url}/${id}/can-login`, d); }
  deactivate(id: number)               { return this.http.delete(`${this.url}/${id}`); }

  exportExcel(dto: ExcelExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export/excel`, dto, { responseType: 'blob' });
  }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LookupsApi extends ApiService {
  private url = `${this.base}/lookups`;

  // همه‌ی گروه‌ها یک‌جا — برای پر کردن همه‌ی dropdownهای یک فرم با یک درخواست
  getAllGrouped() { return this.http.get<LookupGroups>(this.url); }
  getByGroup(groupKey: string) {
    return this.http.get<LookupValue[]>(this.url, { params: { groupKey } });
  }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StudentsApi extends ApiService {
  private url = `${this.base}/students`;

  list(dto: SmartFilterRequest)        { return this.http.post<PagedResult<Student>>(`${this.url}/list`, dto); }
  getOne(id: number)                   { return this.http.get<Student>(`${this.url}/${id}`); }
  create(d: any)                       { return this.http.post<Student>(this.url, d); }
  update(id: number, d: any)           { return this.http.patch<Student>(`${this.url}/${id}`, d); }
  setCanLogin(id: number, d: { canLogin: boolean; password?: string }) { return this.http.patch(`${this.url}/${id}/can-login`, d); }
  deactivate(id: number)               { return this.http.delete(`${this.url}/${id}`); }
  setDisabilities(id: number, items: any[]) { return this.http.put(`${this.url}/${id}/disabilities`, { items }); }
  setAssistiveDevices(id: number, ids: number[]) { return this.http.put(`${this.url}/${id}/assistive-devices`, { ids }); }
  getUnassignedCount(centerId: number, academicYearId: number) {
    return this.http.get<{ count: number }>(`${this.url}/unassigned-count`, { params: { centerId: String(centerId), academicYearId: String(academicYearId) } });
  }
  getUnassignedList(centerId: number, academicYearId: number) {
    return this.http.post<PagedResult<Student>>(`${this.url}/list`, {
      page: 1, pageSize: 200,
      filters: [
        { field: 'centerId', fieldType: 'number', operator: 'eq', value: centerId, order: 1 },
        { field: 'isActive', fieldType: 'boolean', operator: 'is_true', order: 2 },
      ],
    });
  }
  assignToClass(id: number, d: { classRoomId: number; gradeId: number; academicYearId: number }) {
    return this.http.post(`${this.url}/${id}/class-assignment`, d);
  }
  revokeClassAssignment(assignmentId: number) {
    return this.http.patch(`${this.url}/class-assignments/${assignmentId}/revoke`, {});
  }
  recordPromotion(id: number, d: { academicYearId: number; decision: string; nextGradeId?: number; note?: string }) {
    return this.http.post(`${this.url}/${id}/promotion`, d);
  }
  exportExcel(dto: ExcelExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export/excel`, dto, { responseType: 'blob' });
  }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class GradesApi extends ApiService {
  private url = `${this.base}/grades`;
  findAll(educationLevelId?: number) {
    const params: Record<string, string> = {};
    if (educationLevelId) params['educationLevelId'] = String(educationLevelId);
    return this.http.get<any[]>(this.url, { params });
  }
  getOne(id: number) { return this.http.get<any>(`${this.url}/${id}`); }
  create(d: any)     { return this.http.post<any>(this.url, d); }
  update(id: number, d: any) { return this.http.patch<any>(`${this.url}/${id}`, d); }
  setCanLogin(id: number, d: { canLogin: boolean; password?: string }) { return this.http.patch(`${this.url}/${id}/can-login`, d); }
  deactivate(id: number)               { return this.http.delete(`${this.url}/${id}`); }
}

// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ImportApi extends ApiService {
  private url = `${this.base}/import`;

  studentTemplate(): Observable<Blob> {
    return this.http.get(`${this.url}/template/students`, { responseType: 'blob' });
  }
  personnelTemplate(): Observable<Blob> {
    return this.http.get(`${this.url}/template/personnel`, { responseType: 'blob' });
  }
  previewStudents(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.url}/preview/students`, fd);
  }
  previewPersonnel(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.url}/preview/personnel`, fd);
  }
  importStudents(file: File, centerId?: number, academicYearId?: number): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    let params: Record<string, string> = {};
    if (centerId) params['centerId'] = String(centerId);
    if (academicYearId) params['academicYearId'] = String(academicYearId);
    return this.http.post(`${this.url}/students`, fd, { params });
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
// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AnalyticsApi extends ApiService {
  private url = `${this.base}/analytics`;

  query(dto: { entity: string; dimensions: string[]; academicYearId?: number; centerId?: number; filters?: any[] }) {
    return this.http.post<any>(`${this.url}/query`, dto);
  }
  superuserSummary(academicYearId?: number) {
    const params: any = {};
    if (academicYearId) params.academicYearId = String(academicYearId);
    return this.http.get<any>(`${this.url}/summary/superuser`, { params });
  }
  centerSummary(centerId: number, academicYearId?: number) {
    const params: any = { centerId: String(centerId) };
    if (academicYearId) params.academicYearId = String(academicYearId);
    return this.http.get<any>(`${this.url}/summary/center`, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class SmartClassApi extends ApiService {
  private url = `${this.base}/smart-class`;

  generate(centerId: number, academicYearId: number) {
    return this.http.post<any>(`${this.url}/generate`, { centerId, academicYearId });
  }

  confirm(centerId: number, academicYearId: number, classes: { name: string; gradeIds: number[]; studentIds: number[] }[]) {
    return this.http.post<any>(`${this.url}/confirm`, { centerId, academicYearId, classes });
  }
}
