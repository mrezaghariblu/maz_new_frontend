
// ─── Enums ───────────────────────────────────────────────────
export type UserType = 'SUPERUSER' | 'CENTER_MANAGER' | 'TEACHER' | 'STAFF' | 'STUDENT';
export type Gender   = 'MALE' | 'FEMALE';
export type DisabilitySeverity = 'MILD' | 'MODERATE' | 'SEVERE';
export type FilterFieldType = 'string' | 'number' | 'date' | 'boolean' | 'enum';
 
export const USER_TYPE_LABEL: Record<UserType, string> = {
  SUPERUSER:      'سوپریوزر',
  CENTER_MANAGER: 'مدیر مرکز',
  TEACHER:        'معلم',
  STAFF:          'کارمند',
  STUDENT:        'دانش‌آموز',
};

export const DISABILITY_SEVERITY_LABEL: Record<DisabilitySeverity, string> = {
  MILD: 'خفیف', MODERATE: 'متوسط', SEVERE: 'شدید',
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE:   'مرد',
  FEMALE: 'زن',
};

// ─── Lookup (مقادیر مرجع با تگ groupKey) ──────────────────────
export interface LookupValue {
  id:        number;
  groupKey:  string;
  code:      string;
  label:     string;
  sortOrder: number;
  isActive:  boolean;
}
export type LookupGroups = Record<string, LookupValue[]>;
 
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
 
export interface CenterUserAssignment {
  id:             number;
  userId:         number;
  centerId:       number;
  academicYearId: number;
  isPrimary:      boolean;
  assignedAt:     string;
  revokedAt?:     string;
  user?:          { id: number; firstName: string; lastName: string; phone?: string; userType: UserType };
}

// ─── Center ─────────────────────────────────────────────────
export interface Center {
  id:           number;
  name:         string;
  organizationCode : string;
  centerTypeId: number;
  centerType?:  LookupValue;
  province:     string;
  city:         string;
  districtId?:  number;
  district?:    LookupValue;
  address?:     string;
  phone?:       string;
  bankAccountNumber?: string;
  shabaNumber?: string;
  establishedYear?: number;
  preSchoolCode?: string;
  primaryCode?: string;
  firstMiddleCode?: string;
  firstMiddleVocationalCode?: string;
  secondMiddleSpecialVocationalCode?: string;
  secondMiddleCode?: string;
  isActive:     boolean;
  createdAt:    string;
  managerName?: string | null;
  managerPhone?: string | null;
  userAssignments?: CenterUserAssignment[];
  _count?:      { userAssignments: number; studentEnrollments: number; };
  centerStatuses?: CenterStatusHistory[];
}
 
// ─── معلولیت ────────────────────────────────────────────────
export interface UserDisability {
  id:               number;
  userId:           number;
  disabilityTypeId: number;
  severity?:        DisabilitySeverity;
  autismLevel?:     number;
  disabilityType?:  LookupValue;
}

// ─── User ───────────────────────────────────────────────────
export interface User {
  id:           number;
  nationalCode: string;
  personnelCode?: string;
  firstName:    string;
  lastName:     string;
  fatherName?:  string;
  gender:       Gender;
  userType:     UserType;
  phone?:       string;
  email?:       string;
  birthDate?:   string;
  birthDay?:    number;
  birthMonth?:  number;
  birthYearShamsi?: number;

  employmentTypeId?: number;
  employmentType?:   LookupValue;
  jobPositionId?:    number;
  jobPosition?:      LookupValue;
  employmentCategoryId?: number;
  employmentCategory?:   LookupValue;
  requiredHours?:    number;
  nonRequiredHours?: number;

  exceptionalEntryDay?:   number;
  exceptionalEntryMonth?: number;
  exceptionalEntryYear?:  number;
  serviceRecordYears?:    number;
  serviceRecordMonths?:   number;
  serviceRecordDays?:     number;

  maritalStatusId?: number;
  maritalStatus?:   LookupValue;
  educationDegreeId?: number;
  educationDegree?:   LookupValue;
  fieldOfStudy?:    string;
  isargariStatus?:  string;
  physicalStatusId?: number;
  physicalStatus?:   LookupValue;

  address?:          string;
  bankAccountNumber?: string;
  shadMobileNumber?: string;
  shadUsername?:     string;
  districtId?:       number;
  district?:         LookupValue;

  willingJudgeCultural?:   boolean;
  willingJudgeQuranEtrat?: boolean;
  willingJudgeSports?:     boolean;
  judgeCertificateField?:  string;

  disabilities?:         UserDisability[];
  isMultipleDisability?: boolean;

  canLogin:     boolean;
  isActive:     boolean;
  createdAt:    string;
  centerAssignments?:      UserCenterAssignment[];
  personnelStatusHistory?: PersonnelStatusHistory[];
}
 
export interface StudentDisability {
  id:               number;
  studentId:        number;
  disabilityTypeId: number;
  severity?:        DisabilitySeverity;
  autismLevel?:     number;
  disabilityType?:  LookupValue;
}

export interface StudentAssistiveDevice {
  id:               number;
  studentId:        number;
  assistiveDeviceId: number;
  assistiveDevice?: LookupValue;
}

export interface StudentClassAssignment {
  id:             number;
  studentId:      number;
  classRoomId:    number;
  gradeId:        number;
  academicYearId: number;
  enrolledAt:     string;
  revokedAt?:     string;
  classRoom?:     { id: number; name: string; teacherAssignments?: any[] };
  grade?:         { id: number; label: string };
  academicYear?:  { id: number; label: string };
}

export interface Student {
  id:           number;
  nationalCode: string;
  firstName:    string;
  lastName:     string;
  gender:       Gender;
  birthDay?:    number;
  birthMonth?:  number;
  birthYearShamsi?: number;
  address?:     string;
  homePhone?:   string;

  guardianName?:              string;
  guardianNationalCode?:      string;
  guardianPhone?:             string;
  guardianPhysicalStatusId?:  number;
  guardianPhysicalStatus?:    LookupValue;

  secondGuardianName?:              string;
  secondGuardianNationalCode?:      string;
  secondGuardianPhone?:             string;
  secondGuardianPhysicalStatusId?:  number;
  secondGuardianPhysicalStatus?:    LookupValue;

  educationLevelId?: number;
  educationLevel?:   LookupValue;
  gradeId?:          number;
  grade?:            any;
  fieldOfStudyId?:   number;
  fieldOfStudy?:     LookupValue;
  centerId?:         number;
  center?:           { id: number; name: string; city: string };
  districtId?:       number;
  district?:         LookupValue;
  attendanceType?:   'SCHOOL_PRESENCE' | 'SPECIAL_COMMISSION_18';
  entryDay?:         number;
  entryMonth?:       number;
  entryYear?:        number;

  physicalStatusId?:  number;
  physicalStatus?:    LookupValue;
  bookTypeId?:        number;
  bookType?:          LookupValue;
  speechDisorderId?:  number;
  speechDisorder?:    LookupValue;
  needsOccupationalTherapy?: boolean;
  needsSpeechTherapy?:       boolean;
  needsPhysiotherapy?:       boolean;

  bankAccountNumber?: string;
  shabaNumber?:       string;

  isMartyrFamily?:       boolean;
  isOrphan?:             boolean;
  isUnderWelfare?:       boolean;
  isUnderRelief?:        boolean;
  hasNonParentGuardian?: boolean;

  willingCultural?: boolean;
  willingArt?:      boolean;
  willingSports?:   boolean;
  willingQuran?:    boolean;
  achievementsText?: string;
  notes?:           string;

  age?:                  number;
  isMultipleDisability?: boolean;
  disabilities?:         StudentDisability[];
  assistiveDevices?:     StudentAssistiveDevice[];
  classAssignments?:     StudentClassAssignment[];
  studentStatusHistory?: any[];

  isActive:  boolean;
  createdAt: string;
  updatedAt?: string;
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
 
// ─── Student (قدیمی — جایگزین شده با نسخه‌ی کامل بالاتر) ────
 
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