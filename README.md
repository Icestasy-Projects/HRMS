# Icestasy HRMS

**HR Management System — Beta v0.2**
Live: [hrms-kappa-nine.vercel.app](https://hrms-kappa-nine.vercel.app)

---

## Overview

Icestasy HRMS is an internal HR management portal built for Icestasy Projects. It handles employee onboarding, attendance tracking, leave management, separation requests, regularization, and team oversight — all role-based so each user sees only what they need.

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
- Change password from profile page (with confirmation dialog)
- Forgot password flow via email reset

### Dashboard
- Role-aware greeting and worklet grid
- Super Admin: team stats and pending leave count only
- Sub Super Admin: both personal stats and admin overview
- Admin/Employee: personal attendance status and leave balance

### Attendance
- Clock in / Clock out with confirmation dialogs
- Half-day marking
- Attendance history log
- Admin view of team attendance
- Regularization requests (submit, approve, reject, retract)
- Location tracking for check-in/check-out

### Leave Management
- Apply for Scheduled Leave (SL) or Sick/Emergency Leave (UL)
- Leave balance display (remaining / total)
- Admin approval / rejection workflow with confirmation dialogs
- Leave history per employee with retract option
- Leave policy defaults: **18 SL + 6 UL** (configurable)
- Weekend holiday SL bonus (auto-added when holiday falls on Sat/Sun)

### Separation
- Employee can submit separation/resignation request
- Admin can approve, reject, or revoke separation requests
- Separation history and status tracking

### Team
- Admin and above can view all team members
- View individual employee details
- Review and action pending leave requests

### Manage (Super Admin / Sub Super Admin)
- **Employees**: List, add, edit, reset password for all employees
- **Add Employee**: Creates auth user with default password, auto-provisions leave balance, sets `must_change_password = true`
- **Departments**: Create and edit departments
- **Positions**: Track roles, headcount planning, activate/deactivate
- **Leave Policy**: Configure leave entitlements per employee type
- **Holidays**: Manage holiday calendar (auto-adjusts leave balances for weekend holidays)
- **Onboarding**: Create onboarding templates with task items by category, priority, and phase
- **Salary Calculator**: Salary computation tools

### UX
- Confirmation dialogs on all destructive and important actions across the entire app
- Reusable `ConfirmSubmitButton` component with variant support (primary, warning, danger)
- Mobile-responsive layout with bottom navigation
- Breadcrumb navigation throughout

---

## Employee Onboarding Flow

1. Super Admin / Sub Super Admin fills the **Add Employee** form
2. System creates auth user with default password
3. Employee record created in `public.users` with correct role, manager, department, and location
4. Leave balance auto-provisioned: **18 Scheduled + 6 Sick/Emergency days**
5. Employee logs in → redirected to **Set Password** page
6. Employee sets new password → lands on Dashboard

---

## Database Schema (public)

| Table | Description |
|-------|-------------|
| `users` | All employee records with role, department, manager, location |
| `attendance_logs` | Daily clock-in/out records with location |
| `leave_requests` | Leave applications and approval status |
| `leave_balances` | Per-user annual leave quota (sl_total, ul_total) |
| `departments` | Department definitions |
| `positions` | Position/role definitions with headcount |
| `holiday_calendar` | Company holidays |
| `leave_policy` | Leave entitlement configuration per employee type |
| `notifications` | In-app notifications per user |
| `audit_logs` | Action trail |
| `salary_adjustments` | Salary change records |
| `monthly_summaries` | Monthly attendance summaries |
| `onboarding_templates` | Onboarding checklist templates per role |
| `onboarding_task_items` | Individual tasks within templates |
| `regularization_requests` | Attendance regularization requests |
| `separation_requests` | Employee separation/resignation requests |

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
| `location` | text | Employee work location |
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

## Project Structure

```
hrms-app/
├── src/
│   ├── app/
│   │   ├── (app)/               # Protected routes (requires auth)
│   │   │   ├── dashboard/
│   │   │   ├── attendance/
│   │   │   │   └── regularization/
│   │   │   ├── leave/
│   │   │   │   ├── request/
│   │   │   │   ├── history/
│   │   │   │   └── separation/
│   │   │   ├── team/
│   │   │   │   ├── leave/
│   │   │   │   └── separation/
│   │   │   ├── manage/
│   │   │   │   ├── employees/
│   │   │   │   ├── departments/
│   │   │   │   ├── positions/
│   │   │   │   ├── holidays/
│   │   │   │   ├── policy/
│   │   │   │   ├── onboarding/
│   │   │   │   └── salary-calculator/
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
│   │   ├── ConfirmSubmitButton.tsx  # Reusable confirmation dialog button
│   │   ├── RegularizationForm.tsx
│   │   ├── RegularizationActions.tsx
│   │   ├── ClockButton.tsx
│   │   └── NavProgress.tsx
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts        # Browser client
│       │   ├── server.ts        # Server client (SSR)
│       │   ├── admin.ts         # Service role client (bypasses RLS)
│       │   └── types.ts
│       ├── attendance.ts        # Shared attendance utilities
│       └── leave.ts             # Leave defaults (DEFAULT_SL_TOTAL, DEFAULT_UL_TOTAL)
```

---

## Key Patterns

### Server Actions with Auth Guard
Every server action re-validates auth and role before executing:
```typescript
async function someAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return
  // ... action logic
}
```

### Admin Client (Bypass RLS)
For operations that need service-role access:
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const admin = createAdminClient()
```

### Confirmation Dialogs
All buttons use `ConfirmSubmitButton` for user confirmation before executing actions:
```tsx
<ConfirmSubmitButton
  label="Delete"
  confirmTitle="Delete Item"
  confirmMessage="Are you sure?"
  confirmLabel="Yes, Delete"
  variant="danger"
/>
```

---

## Status

**Beta v0.2** — Core flows functional with full confirmation dialog coverage.

| Feature | Status |
|---------|--------|
| Auth & roles | Done |
| Dashboard | Done |
| Attendance | Done |
| Leave management | Done |
| Regularization | Done |
| Separation requests | Done |
| Team view | Done |
| Employee management | Done |
| Department management | Done |
| Position management | Done |
| Holiday calendar | Done |
| Onboarding templates | Done |
| Confirmation dialogs | Done |
| First-login password flow | Done |
| Salary calculator | Done |
| Email notifications | Pending |
| Payroll / Tally export | Pending |
| Mobile testing | Pending |
