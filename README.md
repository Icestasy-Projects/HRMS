# Icestasy HRMS

**HR Management System — Beta v0.1**
Live: [hrms-kappa-nine.vercel.app](https://hrms-kappa-nine.vercel.app)

---

## Overview

Icestasy HRMS is an internal HR management portal built for Icestasy Projects. It handles employee onboarding, attendance tracking, leave management, and team oversight — all role-based so each user sees only what they need.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| Styling | Inline styles (no Tailwind) |

---

## Role Hierarchy

```
Super Admin
│   Full system access. No manager. Cannot see personal attendance/leave.
│
├── Sub Super Admin
│       Full system access (manage + team) + personal attendance & leave.
│       Manager auto-assigned to Super Admin.
│
├── Admin
│       Team management + personal attendance & leave.
│       Manager can be Super Admin, Sub Super Admin, or another Admin.
│
└── Employee
        Personal attendance & leave only.
        Manager selected from Admin and above.
```

---

## Features

### Authentication
- Email + password login via Supabase Auth
- First-login forced password change (`must_change_password` flag)
- Change password from avatar menu at any time
- Forgot password flow via email reset

### Dashboard
- Role-aware greeting and worklet grid
- Super Admin: team stats and pending leave count only
- Sub Super Admin: both personal stats and admin overview
- Admin/Employee: personal attendance status and leave balance

### Attendance
- Clock in / Clock out
- Half-day marking
- Attendance history log
- Admin view of team attendance

### Leave Management
- Apply for Scheduled Leave (SL) or Sick/Emergency Leave (UL)
- Leave balance display (remaining / total)
- Admin approval / rejection workflow
- Leave history per employee

### Team
- Admin and above can view all team members
- View individual employee details
- Review and action pending leave requests

### Manage (Super Admin / Sub Super Admin)
- **Employees**: List, add, edit all employees
- **Add Employee**: Creates auth user with default password `Test@123`, auto-provisions leave balance, sets `must_change_password = true`
- **Departments**: Create and manage departments
- **Leave Policy**: Configure leave entitlements
- **Holidays**: Manage holiday calendar

---

## Employee Onboarding Flow

1. Super Admin / Sub Super Admin fills the **Add Employee** form
2. System creates auth user with password `Test@123`
3. Employee record created in `public.users` with correct role and manager
4. Leave balance auto-provisioned: **18 Scheduled + 6 Sick/Emergency days**
5. Employee logs in → redirected to **Set Password** page
6. Employee sets new password → lands on Dashboard

---

## Database Schema (public)

| Table | Description |
|-------|-------------|
| `users` | All employee records with role, department, manager |
| `attendance_logs` | Daily clock-in/out records |
| `leave_requests` | Leave applications and approval status |
| `leave_balances` | Per-user annual leave quota and usage |
| `departments` | Department definitions |
| `holiday_calendar` | Company holidays |
| `leave_policy` | Leave entitlement configuration |
| `notifications` | In-app notifications per user |
| `audit_logs` | Action trail |
| `salary_adjustments` | Salary change records |
| `monthly_summaries` | Monthly attendance summaries |

### Key Columns — `public.users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Matches `auth.users.id` |
| `email` | text | Work email |
| `name` | text | Full name |
| `role` | user_role enum | `employee`, `admin`, `sub_super_admin`, `super_admin` |
| `employee_type` | employee_type enum | `white_collar`, `blue_collar` |
| `department_id` | uuid | FK → departments |
| `manager_id` | uuid | FK → users (self-referential) |
| `is_active` | boolean | Soft delete flag |
| `must_change_password` | boolean | Forces password change on first login |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Local Development

```bash
cd hrms-app
npm install
npm run dev
```

App runs at `http://localhost:3000`

---

## Deployment

- **Branch**: `main` → auto-deploys to Vercel production
- **Feature branches**: open PR → Vercel preview deployment created automatically

---

## Default Credentials (Development / Onboarding)

| Purpose | Email | Password |
|---------|-------|----------|
| New employees (temporary) | their work email | `Test@123` |

Employees must change password on first login.

---

## Project Structure

```
hrms-app/
├── src/
│   ├── app/
│   │   ├── (app)/               # Protected routes (requires auth)
│   │   │   ├── dashboard/
│   │   │   ├── attendance/
│   │   │   ├── leave/
│   │   │   ├── team/
│   │   │   ├── manage/
│   │   │   │   ├── employees/
│   │   │   │   ├── departments/
│   │   │   │   ├── holidays/
│   │   │   │   └── policy/
│   │   │   ├── notifications/
│   │   │   └── profile/
│   │   ├── login/               # Public login page
│   │   ├── set-password/        # First-login password change
│   │   └── api/
│   │       └── employees/
│   │           └── create/      # POST — create auth user + public.users
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx     # Top nav, drawer, bottom nav
│   │   ├── Breadcrumb.tsx
│   │   └── NavProgress.tsx
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts        # Browser client
│       │   ├── server.ts        # Server client (SSR)
│       │   ├── admin.ts         # Service role client (bypasses RLS)
│       │   └── types.ts
│       └── attendance.ts        # Shared attendance utilities
```

---

## Status

**Beta v0.1** — Core flows functional. Not yet in production rollout.

| Feature | Status |
|---------|--------|
| Auth & roles | ✅ Done |
| Dashboard | ✅ Done |
| Attendance | 🚧 Work in Progress |
| Leave management | ✅ Done |
| Team view | ✅ Done |
| Employee management | ✅ Done |
| First-login password flow | ✅ Done |
| Email notifications | ⏳ Pending |
| Payroll / Tally export | ⏳ Pending |
| Mobile testing | ⏳ Pending |
