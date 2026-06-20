
// ─── Enums ───────────────────────────────────────────────────
export type UserType = 'SUPERUSER' | 'CENTER_MANAGER' | 'TEACHER' | 'STAFF' | 'STUDENT';
export type Gender   = 'MALE' | 'FEMALE';
export type CenterType = 'PRIMARY' | 'MIDDLE' | 'HIGH' | 'VOCATIONAL';
export type FilterFieldType = 'string' | 'number' | 'date' | 'boolean' | 'enum';
 
export const USER_TYPE_LABEL: Record<UserType, string> = {
  SUPERUSER:      'سوپریوزر',
  CENTER_MANAGER: 'مدیر مرکز',
  TEACHER:        'معلم',
  STAFF:          'کارمند',
  STUDENT:        'دانش‌آموز',
};
 
export const CENTER_TYPE_LABEL: Record<CenterType, string> = {
  PRIMARY:    'دبستان',
  MIDDLE:     'متوسطه اول',
  HIGH:       'دبیرستان',
  VOCATIONAL: 'هنرستان',
};
 
export const GENDER_LABEL: Record<Gender, string> = {
  MALE:   'مرد',
  FEMALE: 'زن',
};
 
// ─── Auth ───────────────────────────────────────────────────
export interface LoginRequest  { nationalCode: string; password: string; }
export interface AuthResponse  {
  accessToken:  string;
  refreshToken: string;
  userType:     UserType;
  centerIds:    number[];
}
export interface JwtClaims {
  sub:       number;
  type:      UserType;
  centerIds: number[];
  exp:       number;
}
 
// ─── Academic Year ──────────────────────────────────────────
export interface AcademicYear {
  id:         number;
  label:      string;
  startDate:  string;
  endDate:    string;
  isActive:   boolean;
  isArchived: boolean;
  createdAt:  string;
}
 
// ─── Center ─────────────────────────────────────────────────
export interface Center {
  id:           number;
  name:         string;
  code:         string;
  type:         CenterType;
  province:     string;
  city:         string;
  address?:     string;
  phone?:       string;
  isActive:     boolean;
  createdAt:    string;
  _count?:      { userAssignments: number; studentEnrollments: number; };
  centerStatuses?: CenterStatusHistory[];
}
 
// ─── User ───────────────────────────────────────────────────
export interface User {
  id:           number;
  nationalCode: string;
  firstName:    string;
  lastName:     string;
  gender:       Gender;
  userType:     UserType;
  phone?:       string;
  email?:       string;
  birthDate?:   string;
  canLogin:     boolean;
  isActive:     boolean;
  createdAt:    string;
  centerAssignments?:      UserCenterAssignment[];
  personnelStatusHistory?: PersonnelStatusHistory[];
}
 
export interface UserCenterAssignment {
  id:             number;
  userId:         number;
  centerId:       number;
  academicYearId: number;
  assignedAt:     string;
  revokedAt?:     string;
  isPrimary:      boolean;
  note?:          string;
  center?:        { id: number; name: string; city: string; };
  academicYear?:  { id: number; label: string; };
}
 
// ─── Student ────────────────────────────────────────────────
export interface Student {
  id:           number;
  nationalCode: string;
  firstName:    string;
  lastName:     string;
  gender:       Gender;
  birthDate?:   string;
  parentName?:  string;
  parentPhone?: string;
  address?:     string;
  isActive:     boolean;
  createdAt:    string;
  enrollments?:           StudentEnrollment[];
  studentStatusHistory?:  StudentStatusHistory[];
}
 
export interface StudentEnrollment {
  id:             number;
  studentId:      number;
  centerId:       number;
  academicYearId: number;
  grade:          string;
  field?:         string;
  enrolledAt:     string;
  center?:        { id: number; name: string; city: string; };
  academicYear?:  { id: number; label: string; };
}
 
// ─── Status ─────────────────────────────────────────────────
export interface StatusType {
  id:          number;
  code:        string;
  label:       string;
  description?: string;
  isActive:    boolean;
  sortOrder:   number;
}
 
export interface PersonnelStatusHistory {
  id:             number;
  userId:         number;
  statusTypeId:   number;
  academicYearId: number;
  effectiveDate:  string;
  endDate?:       string;
  note?:          string;
  createdAt:      string;
  statusType?:    StatusType;
  academicYear?:  { id: number; label: string; };
}
 
export interface StudentStatusHistory {
  id:             number;
  studentId:      number;
  statusTypeId:   number;
  academicYearId: number;
  effectiveDate:  string;
  endDate?:       string;
  note?:          string;
  statusType?:    StatusType;
}
 
export interface CenterStatusHistory {
  id:             number;
  centerId:       number;
  statusTypeId:   number;
  academicYearId: number;
  effectiveDate:  string;
  endDate?:       string;
  note?:          string;
  statusType?:    StatusType;
}
 
// ─── Smart Filter ────────────────────────────────────────────
export type StringOperator  = 'contains'|'not_contains'|'equals'|'not_equals'|'starts_with'|'ends_with'|'is_empty'|'is_not_empty';
export type NumberOperator  = 'equals'|'not_equals'|'greater_than'|'less_than'|'greater_or_equal'|'less_or_equal'|'between'|'not_between'|'is_null'|'is_not_null';
export type DateOperator    = 'equals'|'before'|'after'|'between'|'this_year'|'this_month'|'is_null'|'is_not_null';
export type BooleanOperator = 'is_true'|'is_false';
 
export interface FilterCondition {
  field:     string;
  fieldType: FilterFieldType;
  operator:  string;
  value?:    string | number | boolean | null;
  valueTo?:  number | string | null;
  order:     number;
}
 
export interface SortConfig { field: string; direction: 'asc'|'desc'; }
 
export interface SmartFilterRequest {
  filters?:  FilterCondition[];
  sort?:     SortConfig;
  page?:     number;
  pageSize?: number;
}
 
export interface PagedResult<T> {
  data:      T[];
  total:     number;
  page:      number;
  pageSize:  number;
  pageCount: number;
}
 
// ─── Excel Export ────────────────────────────────────────────
export interface ExcelColumn {
  field:   string;
  header:  string;
  order:   number;
  width?:  number;
  format?: string;
}
 
export interface ExcelExportRequest extends SmartFilterRequest {
  columns:    ExcelColumn[];
  sheetName?: string;
  filename?:  string;
}
 
// ─── Audit ──────────────────────────────────────────────────
export interface AuditLog {
  id:             number;
  entity:         string;
  entityId:       number;
  action:         'CREATE'|'UPDATE'|'DELETE';
  beforeData?:    unknown;
  afterData?:     unknown;
  ipAddress?:     string;
  createdAt:      string;
  performedBy?:   { id: number; firstName: string; lastName: string; userType: UserType; };
  academicYear?:  { id: number; label: string; };
}