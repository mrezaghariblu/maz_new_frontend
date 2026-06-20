// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, superuserGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Users
      { path: 'users',                loadComponent: () => import('./features/users/users-list/users-list.component').then(m => m.UsersListComponent) },
      { path: 'users/new',            canActivate: [superuserGuard], loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent) },
      { path: 'users/:id',            loadComponent: () => import('./features/users/user-detail/user-detail.component').then(m => m.UserDetailComponent) },
      { path: 'users/:id/edit',       loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent) },
      { path: 'users/:id/password',   canActivate: [superuserGuard], loadComponent: () => import('./features/users/change-password/change-password.component').then(m => m.ChangePasswordComponent) },

      // Students
      { path: 'students',             loadComponent: () => import('./features/students/students-list/students-list.component').then(m => m.StudentsListComponent) },
      { path: 'students/new',         loadComponent: () => import('./features/students/student-form/student-form.component').then(m => m.StudentFormComponent) },
      { path: 'students/:id',         loadComponent: () => import('./features/students/student-detail/student-detail.component').then(m => m.StudentDetailComponent) },
      { path: 'students/:id/edit',    loadComponent: () => import('./features/students/student-form/student-form.component').then(m => m.StudentFormComponent) },

      // Centers
      { path: 'centers',              loadComponent: () => import('./features/centers/centers-list/centers-list.component').then(m => m.CentersListComponent) },
      { path: 'centers/new',          canActivate: [superuserGuard], loadComponent: () => import('./features/centers/center-form/center-form.component').then(m => m.CenterFormComponent) },
      { path: 'centers/:id',          loadComponent: () => import('./features/centers/center-detail/center-detail.component').then(m => m.CenterDetailComponent) },
      { path: 'centers/:id/edit',     canActivate: [superuserGuard], loadComponent: () => import('./features/centers/center-form/center-form.component').then(m => m.CenterFormComponent) },

      // Other
      { path: 'status',         loadComponent: () => import('./features/status/status-list/status-list.component').then(m => m.StatusListComponent) },
      { path: 'academic-years', canActivate: [superuserGuard], loadComponent: () => import('./features/academic-years/academic-years.component').then(m => m.AcademicYearsComponent) },
      { path: 'audit',          canActivate: [superuserGuard], loadComponent: () => import('./features/audit/audit-list/audit-list.component').then(m => m.AuditListComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];