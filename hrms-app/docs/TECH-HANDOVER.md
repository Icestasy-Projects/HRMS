# Technical Handover Document — HRMS Application

**Prepared for:** Incoming Tech Manager  
**Application:** Icestasy HRMS (Human Resource Management System)  
**Live URL:** https://hrms-kappa-nine.vercel.app  
**Repository:** https://github.com/Icestasy-Projects/hrms  
**Date:** November 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Repository Structure](#4-repository-structure)
5. [Environment Setup](#5-environment-setup)
6. [Database Architecture](#6-database-architecture)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Feature Modules](#8-feature-modules)
9. [API Routes](#9-api-routes)
10. [Server Actions](#10-server-actions)
11. [Database Functions & Triggers](#11-database-functions--triggers)
12. [Email System](#12-email-system)
13. [Deployment & CI/CD](#13-deployment--cicd)
14. [Styling & UI Architecture](#14-styling--ui-architecture)
15. [Key Business Rules](#15-key-business-rules)
16. [Known Considerations & Technical Debt](#16-known-considerations--technical-debt)
17. [Maintenance Procedures](#17-maintenance-procedures)
18. [Troubleshooting Guide](#18-troubleshooting-guide)
19. [Credentials & Access](#19-credentials--access)
20. [Version History](#20-version-history)

---

## 1. System Overview

The HRMS is a full-stack web application built for Icestasy Projects to manage employee attendance, leave, reimbursements, onboarding, payroll calculations, and team management. It serves approximately 20-50 employees across multiple roles and departments.

**Core Capabilities:**
- Real-time attendance tracking (clock in/out with half-day detection)
- Leave management (Scheduled Leave and Unscheduled Leave with auto-deductions)
- Reimbursement claims workflow with analytics
- Team management and org chart visualization
- Salary calculations and monthly payroll summaries
- Onboarding templates and task tracking
- Separation (resignation/sabbatical) requests
- Attendance regularization (correction requests)
- Holiday calendar management
- In-app notifications with email alerts
- Excel export for reimbursements
- PDF generation capabilities
- Audit logging for admin actions

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | Next.js (App Router) | 16.2.9 | Uses React Server Components heavily |
| **UI Library** | React | 19.2.4 | With ReactDOM 19.2.4 |
| **Language** | TypeScript | ^5 | Strict mode |
| **Database** | Supabase (PostgreSQL) | — | Hosted at `avvqtcekupunqrbzbpcd.supabase.co` |
| **Auth** | Supabase Auth via `@supabase/ssr` | ^0.12.0 | Cookie-based sessions |
| **ORM/Client** | `@supabase/supabase-js` | ^2.108.2 | Direct SQL client, no ORM |
| **Icons** | lucide-react | ^1.21.0 | SVG icon library |
| **Email** | Resend | ^6.16.0 | Transactional emails |
| **Date Utils** | date-fns | ^4.4.0 | Date manipulation |
| **PDF** | jspdf + html2canvas | ^4.2.1 / ^1.4.1 | Client-side PDF generation |
| **Excel** | xlsx (SheetJS) | ^0.18.5 | Server-side Excel export |
| **CSS Utils** | clsx | ^2.1.1 | Conditional class names |
| **Deployment** | Vercel | — | Auto-deploy from `main` branch |
| **Dev Tooling** | Tailwind CSS + PostCSS | ^4 | Dev dependency only (not used at runtime) |

### Key Architectural Decisions
- **No ORM** — Direct Supabase client calls throughout. Queries use the Supabase JS SDK.
- **No Tailwind at runtime** — All production styling uses inline React `style` props with CSS custom properties.
- **Server Components by default** — Pages are async server components; interactive parts are `'use client'` components.
- **Server Actions for mutations** — Form submissions and data writes use inline `'use server'` functions.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    Vercel CDN                     │
│              (Auto-deploy from main)              │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              Next.js App Router                   │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Server       │  │ Client       │              │
│  │ Components   │  │ Components   │              │
│  │ (pages)      │  │ (interactive)│              │
│  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                      │
│  ┌──────▼───────┐  ┌──────▼───────┐              │
│  │ Server       │  │ Browser      │              │
│  │ Actions      │  │ Supabase     │              │
│  │ (mutations)  │  │ Client       │              │
│  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                      │
│  ┌──────▼──────────────────▼───────┐              │
│  │       Supabase Clients          │              │
│  │  ┌────────┐ ┌────────┐ ┌─────┐ │              │
│  │  │ Server │ │Browser │ │Admin│ │              │
│  │  │ (SSR)  │ │        │ │(SRK)│ │              │
│  │  └────────┘ └────────┘ └─────┘ │              │
│  └──────────────┬──────────────────┘              │
└─────────────────┼───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Supabase (PostgreSQL)                   │
│                                                   │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐  │
│  │   Auth    │ │  Database  │ │  Row Level   │  │
│  │  (Users)  │ │  (18 tbls) │ │  Security    │  │
│  └───────────┘ └────────────┘ └──────────────┘  │
│                                                   │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Functions │ │  Triggers  │ │    Views     │  │
│  │   (26)    │ │    (16)    │ │     (4)      │  │
│  └───────────┘ └────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│               Resend (Email)                      │
│  Leave notifications to managers & employees      │
└─────────────────────────────────────────────────┘
```

### Three Supabase Client Types

1. **Server Client** (`src/lib/supabase/server.ts`) — Used in Server Components and Server Actions. Creates a client with cookie-based auth via `@supabase/ssr`. Respects RLS policies (queries run as the logged-in user).

2. **Browser Client** (`src/lib/supabase/client.ts`) — Used in Client Components. Created with `createBrowserClient()`. Also respects RLS.

3. **Admin Client** (`src/lib/supabase/admin.ts`) — Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS entirely. Used only in API routes and server actions where admin-level access is required (e.g., creating employees, audit logging, reimbursement export).

```typescript
// Admin client — bypasses ALL RLS policies
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

---

## 4. Repository Structure

```
hrms/
└── hrms-app/                          # Next.js application root
    ├── package.json                   # Dependencies & scripts
    ├── next.config.ts                 # Next.js config (minimal)
    ├── tsconfig.json                  # TypeScript config
    ├── postcss.config.mjs             # PostCSS config
    ├── CLAUDE.md / AGENTS.md          # AI assistant guidelines
    ├── public/                        # Static assets
    └── src/
        ├── middleware.ts              # Auth middleware (route protection)
        ├── components/
        │   ├── layout/
        │   │   └── AppShell.tsx       # Main navigation shell (382 lines)
        │   ├── ui/
        │   │   ├── Spinner.tsx        # Loading spinner
        │   │   └── Alert.tsx          # Alert component
        │   ├── Breadcrumb.tsx
        │   ├── ClockButton.tsx        # Check-in/out with confirmation dialog
        │   ├── ConfirmSubmitButton.tsx # Generic confirmation wrapper
        │   ├── EditTimeCell.tsx       # Admin editable time cell
        │   ├── FormButton.tsx
        │   ├── NavProgress.tsx        # Page navigation progress bar
        │   ├── PageSkeleton.tsx       # Loading skeleton
        │   ├── RegularizationActions.tsx
        │   ├── RegularizationForm.tsx
        │   ├── SubmitButton.tsx
        │   ├── SuccessToast.tsx
        │   └── WorkletGrid.tsx        # Dashboard tile grid (87 lines)
        ├── lib/
        │   ├── supabase/
        │   │   ├── server.ts          # Server-side Supabase client
        │   │   ├── client.ts          # Browser-side Supabase client
        │   │   ├── admin.ts           # Admin client (service role key)
        │   │   └── types.ts           # TypeScript types
        │   ├── attendance.ts          # IST time, schedules, geofence, half-day logic
        │   ├── leave.ts               # Leave defaults, workday counting
        │   ├── audit.ts               # Audit log helper
        │   ├── email.ts               # Email templates via Resend
        │   ├── env.ts                 # Environment variable config
        │   └── logo.ts               # Base64 company logo (large file ~83KB)
        └── app/
            ├── layout.tsx             # Root HTML layout
            ├── page.tsx               # Root redirect
            ├── globals.css            # CSS custom properties / theme tokens
            ├── error.tsx              # Error boundary
            ├── login/page.tsx         # Login page
            ├── set-password/page.tsx  # Forced password change
            ├── update-password/page.tsx # Password reset
            ├── auth/callback/route.ts # OAuth/magic-link callback
            ├── api/
            │   ├── auth/signout/route.ts
            │   ├── employees/create/route.ts
            │   └── reimbursement/export/route.ts
            └── (app)/                 # Authenticated route group
                ├── layout.tsx         # Auth check + AppShell wrapper
                ├── dashboard/page.tsx # Main dashboard
                ├── attendance/        # Attendance module (3 sub-routes)
                ├── leave/             # Leave module (4 sub-routes)
                ├── holidays/          # Holiday calendar
                ├── notifications/     # In-app notifications
                ├── profile/           # User profile / password change
                ├── reimbursement/     # Reimbursement module (2 sub-routes)
                ├── team/              # Team module (8 sub-routes)
                └── manage/            # Admin module (7 sub-routes)
```

### Key Files by Size/Complexity

| File | Lines | Complexity |
|------|-------|------------|
| `AppShell.tsx` | ~382 | High — role-based nav, mobile/desktop, drawer |
| `ReimbursementList.tsx` | ~482 | High — 4 tabbed views, status management |
| `attendance/page.tsx` | ~452 | High — clock in/out, monthly hours, half-day logic |
| `AnalyticsView.tsx` | ~358 | Medium — charts, data aggregation |
| `leave/request/LeaveRequestForm.tsx` | ~300+ | Medium — form with date validation |
| `team/leave/page.tsx` | ~300+ | Medium — approval workflow |
| `manage/employees/page.tsx` | ~250+ | Medium — employee CRUD list |

---

## 5. Environment Setup

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm or pnpm
- Git access to `Icestasy-Projects/hrms`
- Supabase project access (dashboard at supabase.com)
- Vercel project access (for deployment management)

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Icestasy-Projects/hrms.git
cd hrms/hrms-app

# 2. Install dependencies
npm install

# 3. Create .env.local file with these variables:
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://avvqtcekupunqrbzbpcd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard → Settings → API>
RESEND_API_KEY=<get from Resend dashboard>
EMAIL_FROM=HRMS <noreply@icestasyprojects.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DEFAULT_EMPLOYEE_PASSWORD=IceCreamOps@123
EOF

# 4. Start development server
npm run dev
# App runs on http://localhost:3000
```

### Environment Variables Reference

| Variable | Required | Where Set | Purpose |
|----------|----------|-----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Vercel + .env.local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Vercel + .env.local | Public API key (client-side safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Vercel only + .env.local | Server-only key (bypasses RLS) |
| `RESEND_API_KEY` | No | Vercel + .env.local | Email sending (gracefully skips if absent) |
| `EMAIL_FROM` | No | Vercel | Sender address (default: `HRMS <noreply@icestasyprojects.com>`) |
| `NEXT_PUBLIC_APP_URL` | No | Vercel | Public app URL for email links |
| `NEXT_PUBLIC_SITE_URL` | No | .env.local | Dev site URL for auth redirects |
| `DEFAULT_EMPLOYEE_PASSWORD` | No | Vercel | Default password for new employees (default: `IceCreamOps@123`) |

### NPM Scripts

```bash
npm run dev     # Start development server (with hot reload)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

---

## 6. Database Architecture

### Supabase Project
- **Project ID:** `avvqtcekupunqrbzbpcd`
- **Region:** (check Supabase dashboard)
- **Dashboard:** https://supabase.com/dashboard/project/avvqtcekupunqrbzbpcd

### Tables (18 total)

#### Core Tables

**`users`** — Employee records (links to Supabase Auth)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, matches Supabase Auth user ID |
| name | text | Full name |
| email | text | Unique, used for login |
| phone | text | Optional |
| role | user_role | super_admin / sub_super_admin / admin / employee |
| employee_type | employee_type | white_collar / blue_collar |
| manager_id | uuid | FK → users (self-referencing hierarchy) |
| department_id | uuid | FK → departments |
| daily_salary | numeric | Used for payroll calculations |
| location | text | Office location |
| join_date | date | Employment start |
| exit_date | date | Employment end (nullable) |
| is_active | boolean | Active/inactive status |
| must_change_password | boolean | Forces password change on next login |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-set via trigger |

**`attendance_logs`** — Daily check-in/out records
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| work_date | date | Default: CURRENT_DATE |
| check_in | time | Clock-in time (IST) |
| check_out | time | Clock-out time (IST) |
| hours_worked | numeric | Computed hours |
| day_status | day_status | 15-value enum (see below) |
| core_window_met | boolean | Whether core hours fulfilled |
| is_field_staff | boolean | Field/office indicator |
| week_deficit | numeric | Weekly hour shortfall |
| deficit_compensated | boolean | Whether deficit was made up |
| notes | text | Admin notes |
| week_number | integer | **GENERATED** from work_date |
| year | integer | **GENERATED** from work_date |

**`leave_requests`** — Leave applications
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| employee_id | uuid | FK → users |
| approved_by | uuid | FK → users (reviewer) |
| leave_type | leave_type | SL (Scheduled) or UL (Unscheduled) |
| duration_type | duration_type | full_day / half_day |
| start_date | date | Leave start |
| end_date | date | Leave end |
| days_deducted | numeric | **Computed by trigger** |
| days_count | numeric | Default: 1 |
| is_half_day | boolean | Default: false |
| status | leave_status | pending / approved / rejected / cancelled |
| reason | text | Employee's reason |
| rejection_reason | text | Admin's rejection reason |

**`leave_balances`** — Annual leave quotas per employee
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| year | integer | Calendar year |
| sl_total | numeric | Default: 18 |
| sl_used | numeric | Default: 0 |
| ul_total | numeric | Default: 6 |
| ul_used | numeric | Default: 0 |
| carried_forward_in | numeric | From previous year |
| carried_forward_out | numeric | To next year |
| sl_remaining | numeric | **GENERATED: sl_total - sl_used** |
| ul_remaining | numeric | **GENERATED: ul_total - ul_used** |
| sl_penalty | numeric | Penalty deduction |

> **CRITICAL:** `sl_remaining` and `ul_remaining` are GENERATED columns. You CANNOT update them directly. Only modify `sl_used`, `ul_used`, `sl_total`, or `ul_total` — the remaining columns auto-compute.

**`reimbursements`** — Expense claims
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| employee_id | uuid | FK → users |
| batch_id | uuid | Groups line items in one submission |
| expense_date | date | When expense occurred |
| category | reimbursement_category | 8-value enum |
| purpose | text | Description |
| amount | numeric | INR amount |
| status | reimbursement_status | pending / approved / rejected |
| reviewed_by | uuid | Admin who reviewed |
| notes | text | Review notes |

#### Supporting Tables

| Table | Purpose |
|-------|--------|
| `departments` | Department definitions (id, name, description) |
| `holiday_calendar` | Public/company/optional holidays (date, name, type) |
| `leave_policy` | Leave rules per employee type (annual quotas, cutoff times, salary multipliers) |
| `notifications` | In-app notifications (recipient, type, title, message, read status) |
| `monthly_summaries` | Monthly payroll summaries (hours, leaves, deductions) |
| `salary_adjustments` | Payroll adjustments |
| `separation_requests` | Resignation/sabbatical requests |
| `attendance_regularizations` | Attendance correction requests |
| `audit_logs` | Admin action audit trail |
| `onboarding_templates` | Onboarding checklist templates |
| `onboarding_task_items` | Individual onboarding tasks |
| `onboarding_progress` | Employee onboarding completion tracking |
| `positions` | Job title/position definitions |
| `weekly_hour_summary` | Weekly hours aggregation |
| `tally_export_logs` | Tally accounting export tracking |

#### Views (4)

| View | Purpose |
|------|--------|
| `v_attendance_with_names` | Attendance logs joined with user names |
| `v_employee_leave_status` | Employee leave balances with user info |
| `v_monthly_deductions_pending_export` | Pending payroll deductions for Tally export |
| `v_pending_approvals` | All pending items needing admin attention |

### Enums

| Enum | Values |
|------|--------|
| `user_role` | super_admin, sub_super_admin, admin, employee |
| `employee_type` | white_collar, blue_collar |
| `day_status` | present, half_day_first_off, half_day_second_off, unscheduled_leave, absent, holiday, weekly_off, pending_compensation, deficit_confirmed, scheduled_half_day_first_off, scheduled_half_day_second_off, unscheduled_half_day_first_off, unscheduled_half_day_second_off, unscheduled_leave_full_day, weekend_work |
| `leave_type` | SL, UL |
| `leave_status` | pending, approved, rejected, cancelled |
| `duration_type` | full_day, half_day |
| `holiday_type` | public, company, optional |
| `reimbursement_category` | travel, meals, accommodation, office_supplies, communication, training, medical, other |
| `reimbursement_status` | pending, approved, rejected |
| `deduction_type` | sl_deduction, ul_deduction, salary_cut |
| `summary_status` | pending, calculated, exported |
| `notification_type` | leave_submitted, leave_approved, leave_rejected, hour_deficit_warning, salary_deduction_alert, month_end_calculated, tally_export_ready |

---

## 7. Authentication & Authorization

### Auth Flow

```
User → Login Page → Supabase Auth (email/password)
                          ↓
                    Session Cookie Set
                          ↓
                    Middleware Check (every request)
                          ↓
              ┌──── Authenticated? ────┐
              │                        │
              Yes                      No
              ↓                        ↓
        must_change_password?    Redirect → /login
              ↓
        Yes → /set-password
        No  → Requested Page
```

### Middleware (`src/middleware.ts`)

Every route request passes through middleware that:
1. Creates a Supabase server client with the request cookies
2. Calls `supabase.auth.getUser()` to verify the session
3. Redirects to `/login` if no valid session
4. Allows through public routes: `/login`, `/auth/callback`, `/update-password`

### Role-Based Access

The app layout (`(app)/layout.tsx`) additionally checks `must_change_password` and redirects to `/set-password` if true.

Navigation items in `AppShell.tsx` are filtered by role:

| Role | Navigation Items |
|------|------------------|
| super_admin | Home, Reimbursement, Team, Manage |
| sub_super_admin | Home, Attendance, Leave, Reimbursement, Team, Manage |
| admin | Home, Attendance, Leave, Reimbursement, Team |
| employee | Home, Attendance, Leave, Reimbursement, Team Calendar |

### Row Level Security (RLS)

All 18 tables have RLS enabled. Two helper functions drive the policies:

```sql
-- Returns the current user's role
CREATE FUNCTION get_my_role() RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns user IDs in the same department (for admin-scoped access)
CREATE FUNCTION get_my_team() RETURNS SETOF uuid AS $$
  SELECT id FROM public.users
  WHERE department_id = (SELECT department_id FROM public.users WHERE id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**RLS Policy Pattern:**
- **super_admin / sub_super_admin**: `USING (get_my_role() IN ('super_admin', 'sub_super_admin'))` — full access
- **admin**: `USING (get_my_role() = 'admin' AND user_id IN (SELECT get_my_team()))` — own + team
- **employee**: `USING (auth.uid() = user_id)` — own records only
- **Public tables**: `departments`, `holiday_calendar`, `leave_policy` have SELECT for all authenticated users

### New Employee Creation Flow

```
Super Admin → /manage/employees/new → POST /api/employees/create
    ↓
1. Verify caller is super_admin or sub_super_admin
2. Create Supabase Auth user with default password (IceCreamOps@123)
3. Upsert into `users` table with role, department, manager, etc.
4. Trigger `init_leave_balance` auto-creates leave_balances row
5. Set must_change_password = true
    ↓
Employee → First login → Forced to /set-password → Dashboard
```

---

## 8. Feature Modules

### 8.1 Dashboard (`/dashboard`)

**File:** `src/app/(app)/dashboard/page.tsx` (222 lines)

Server component that renders:
- **Hero banner** — Gradient blue header with greeting (time-of-day based), current date, and attendance status badge
- **Worklet grid** — Tile links to all features, filtered by role. Uses `WorkletGrid.tsx` client component with lucide-react icons
- **Quick stats** — Cards showing: today's attendance status, SL remaining, UL remaining, pending leave approvals (admin only)

The worklet grid shows different tiles per role — super_admin sees management tools but NOT personal attendance tiles (since their attendance isn't tracked).

### 8.2 Attendance (`/attendance`)

**File:** `src/app/(app)/attendance/page.tsx` (452 lines)

Core features:
- **Clock In / Clock Out** — Server action `clockInOut` that inserts/updates `attendance_logs`. Includes confirmation dialog via `ClockButton.tsx`
- **Monthly Hours Tracker** — Visual progress bar showing worked hours vs. required hours for the month
- **Half-Day Auto-Detection** — If check-in after 13:30 IST or check-out before 14:30 IST, automatically marks as half-day and deducts 0.5 UL (or SL if UL exhausted)
- **Weekend Work Support** — Allows clock-in on weekends, recorded as `weekend_work` status

**Sub-routes:**
- `/attendance/history` — Personal attendance log with date filtering
- `/attendance/regularization` — Submit correction requests for incorrect attendance

**Key Business Logic** (in `src/lib/attendance.ts`):
- All times are IST (UTC+5:30) — computed via `nowIST()`, `todayIST()`, `timeIST()`
- Schedules: white_collar = Mon-Fri, 9 hours/day; blue_collar = Mon-Sat, 8 hours/day
- Geofence: Office at (15.4023°N, 73.9867°E), 500m radius — **currently disabled** in check-in flow

### 8.3 Leave Management (`/leave`)

**Files:** `leave/page.tsx`, `leave/request/`, `leave/history/`, `leave/separation/`

Features:
- **Leave Balances** — Shows SL remaining (out of 18) and UL remaining (out of 6)
- **Apply for Leave** — Form with leave type, duration type, date range, reason. Validates against available balance
- **Leave History** — Filterable list of all leave requests with status
- **Separation Requests** — Resignation or sabbatical application form

**Leave Types:**
| Type | Code | Annual Quota | Carry Forward |
|------|------|-------------|---------------|
| Scheduled Leave | SL | 18 days | Up to 12 days |
| Unscheduled Leave | UL | 6 days | None |

**Auto-Deduction Flow:**
```
Employee arrives late (after 13:30) or leaves early (before 14:30)
    ↓
Attendance trigger fires → marks as half_day
    ↓
System auto-creates UL leave request (approved)
    ↓
If UL exhausted → deducts from SL instead
    ↓
If both exhausted → salary deduction at 1.5x daily rate
```

### 8.4 Reimbursement (`/reimbursement`)

**Files:** `reimbursement/page.tsx`, `ReimbursementList.tsx`, `AnalyticsView.tsx`, `new/ReimbursementForm.tsx`

Features:
- **My Claims** tab — Employee's own reimbursement submissions
- **Review** tab — Admin view of pending claims for approval/rejection (admin+)
- **All Claims** tab — Organization-wide view with search and filters (super_admin only)
- **Analytics** tab — Per-employee spending cards with bar charts, category breakdown (super_admin only)
- **New Claim** — Form with batch support (multiple line items per submission)
- **Excel Export** — Download all claims as .xlsx via `/api/reimbursement/export`

**Categories:** travel, meals, accommodation, office_supplies, communication, training, medical, other

### 8.5 Team Management (`/team`)

**Sub-routes:**
| Route | Purpose | Access |
|-------|---------|--------|
| `/team` | Team directory with department filtering | admin+ |
| `/team/calendar` | Team availability calendar | all |
| `/team/leave` | Leave request approvals | admin+ |
| `/team/leave-overview` | All employees' leave balances | super_admin / sub_super_admin |
| `/team/regularization` | Attendance correction approvals | super_admin / sub_super_admin |
| `/team/separation` | Separation request approvals | super_admin / sub_super_admin |
| `/team/hours` | Hours tracker for all employees | super_admin / sub_super_admin |
| `/team/org-chart` | Visual organization hierarchy | admin+ |

### 8.6 Admin Management (`/manage`)

**Sub-routes:**
| Route | Purpose |
|-------|--------|
| `/manage` | Admin hub / landing page |
| `/manage/employees` | Employee list + CRUD |
| `/manage/employees/new` | Create new employee |
| `/manage/employees/[id]` | Edit employee |
| `/manage/departments` | Department management |
| `/manage/holidays` | Holiday calendar management |
| `/manage/policy` | Leave policy configuration |
| `/manage/positions` | Job position definitions |
| `/manage/onboarding` | Onboarding templates and tracking |
| `/manage/salary-calculator` | Salary calculation tool |

### 8.7 Other Modules

- **Notifications** (`/notifications`) — In-app notification feed with read/unread status
- **Holidays** (`/holidays`) — Public holidays calendar (read-only for employees)
- **Profile** (`/profile`) — Password change functionality

---

## 9. API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|--------|
| `POST /api/auth/signout` | POST | Any authenticated | Signs out user via Supabase, redirects to `/login` |
| `POST /api/employees/create` | POST | super_admin, sub_super_admin | Creates new employee (Supabase Auth user + users table + leave balance) |
| `GET /api/reimbursement/export` | GET | admin+ | Exports reimbursements to Excel (.xlsx) |
| `GET /auth/callback` | GET | Public | Handles OAuth code exchange and OTP password recovery |

### Employee Creation API Detail

```
POST /api/employees/create
Body: { name, email, phone?, role, employee_type, department_id, manager_id?, daily_salary?, location? }

Flow:
1. Verify caller role (super_admin or sub_super_admin)
2. Create Supabase Auth user: supabase.auth.admin.createUser({ email, password: DEFAULT_EMPLOYEE_PASSWORD })
3. Upsert users table row with all fields + must_change_password=true
4. Trigger auto-creates leave_balances row
5. On failure: rolls back Auth user creation
```

---

## 10. Server Actions

Server Actions are defined inline in page files using the `'use server'` directive. Key actions:

| Page | Action | What It Does |
|------|--------|-------------|
| `attendance/page.tsx` | `clockInOut` | Check in or check out for current day |
| `attendance/page.tsx` | `deductHalfDayLeave` | Auto-deduct 0.5 UL/SL for half-days |
| `leave/request/LeaveRequestForm.tsx` | Submit leave | Creates leave_request row, sends email to manager |
| `team/leave/page.tsx` | Approve/reject | Updates leave status, triggers balance update |
| `reimbursement/new/ReimbursementForm.tsx` | Submit claim | Creates reimbursement rows with batch_id |
| `reimbursement/ReimbursementList.tsx` | Review claim | Approve/reject reimbursement |
| `attendance/regularization/page.tsx` | Submit regularization | Creates regularization request |
| `team/regularization/page.tsx` | Approve regularization | Updates attendance_logs based on approved request |
| `manage/employees/[id]/page.tsx` | Update employee | Updates users table fields |
| `manage/holidays/page.tsx` | Add/edit/delete holiday | Modifies holiday_calendar |

---

## 11. Database Functions & Triggers

### Triggers (Automatic Business Logic)

These triggers fire automatically and are critical to system correctness:

| Trigger | Table | Event | Effect |
|---------|-------|-------|--------|
| `trg_classify_attendance` | attendance_logs | BEFORE INSERT/UPDATE | Auto-classifies day_status based on check-in/out times |
| `trg_auto_flag_unscheduled_leave` | attendance_logs | AFTER INSERT/UPDATE | Auto-creates approved UL leave request for late/early/absent |
| `trg_compute_days_deducted` | leave_requests | BEFORE INSERT | Calculates days_deducted based on date range (excluding weekends/holidays) |
| `trg_set_halfday_end_date` | leave_requests | BEFORE INSERT/UPDATE | Sets end_date = start_date for half-day requests |
| `trg_auto_approve_unscheduled` | leave_requests | AFTER INSERT | Auto-approves UL-type leave requests |
| `trg_leave_balance_on_approval` | leave_requests | AFTER UPDATE | Updates leave_balances.sl_used or ul_used when leave is approved |
| `trg_ul_penalty` | leave_requests | AFTER INSERT/UPDATE/DELETE | Recalculates UL penalty for the employee |
| `trg_init_leave_balance` | users | AFTER INSERT | Creates leave_balances row for new employees |
| `trg_*_updated_at` | Multiple | BEFORE UPDATE | Updates `updated_at` timestamp |

### Scheduled/Cron Functions

These should be configured as Supabase scheduled functions (check Supabase dashboard → Database → Extensions → pg_cron):

| Function | Schedule | Purpose |
|----------|----------|--------|
| `flag_absent_employees()` | Daily (evening) | Marks employees with no check-in as absent |
| `flag_no_checkout_employees()` | Daily (evening) | Flags employees who checked in but didn't check out |
| `auto_checkout_missed()` | Daily (late evening) | Auto-checks-out employees at EOD |
| `run_all_monthly_calculations()` | Monthly (1st of month) | Runs payroll calculations for all employees |
| `run_year_end_carry_forward()` | Annually (Jan 1) | Carries forward SL balances (max 12 days) |

> **Important:** Verify these cron schedules are active in the Supabase dashboard. If not, they need to be set up via `pg_cron` extension or Supabase Edge Functions.

---

## 12. Email System

**Provider:** Resend (https://resend.com)  
**Config file:** `src/lib/email.ts`  
**Sender:** `HRMS <noreply@icestasyprojects.com>`

### Email Functions

```typescript
// Notifies manager when employee applies for leave
sendLeaveAppliedEmail(managerEmail, employeeName, leaveType, startDate, endDate, reason)

// Notifies employee when leave is approved/rejected
sendLeaveDecisionEmail(employeeEmail, status, leaveType, startDate, endDate, rejectionReason?)
```

### Email Templates
- HTML-formatted with Icestasy branding (blue header, logo, structured content)
- Include action links to the HRMS app
- Graceful degradation: if `RESEND_API_KEY` is not set, emails are silently skipped (console warning only)

### Resend Account
- Domain: `icestasyprojects.com`
- Dashboard: https://resend.com/api-keys (login with Icestasy account)

---

## 13. Deployment & CI/CD

### Vercel Deployment

- **Platform:** Vercel (https://vercel.com)
- **Production URL:** https://hrms-kappa-nine.vercel.app
- **Auto-deploy:** Every push to `main` triggers a production build
- **Preview deploys:** Feature branches get preview URLs automatically
- **Build command:** `next build` (default)
- **Output:** Serverless functions + static assets

### Deployment Workflow

```
Developer → Push to feature branch → Vercel creates preview deployment
                                          ↓
                                   Test on preview URL
                                          ↓
                              Merge PR to main branch
                                          ↓
                            Vercel auto-deploys to production
```

### Environment Variables in Vercel

All env vars listed in Section 5 must be configured in:
**Vercel Dashboard → Project → Settings → Environment Variables**

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for **Production** and **Preview** environments.

### Build Notes
- Build time: typically 30-60 seconds
- No custom build settings needed
- The `next.config.ts` is minimal (no custom webpack, rewrites, or redirects)
- Tailwind CSS is a dev dependency but NOT used in production styles (all inline)

---

## 14. Styling & UI Architecture

### CSS Custom Properties

The design system is defined in `src/app/globals.css` using CSS custom properties:

```css
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface2: #f1f5f9;
  --border: #e2e8f0;
  --text: #1e293b;
  --muted: #64748b;
  --primary: #0f52a8;
  --primary-l: #dbeafe;
  --success: #16a34a;
  --success-l: #dcfce7;
  --warning: #f59e0b;
  --warning-l: #fef3c7;
  --danger: #ef4444;
  --danger-l: #fee2e2;
  --shadow: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
}
```

### Styling Approach
- **All inline styles** — Using React's `style` prop
- **No CSS modules or styled-components**
- **Responsive design** via `<style>` tags within components for media queries
- **Breakpoint:** 768px (mobile ↔ desktop)

### AppShell Layout
- **Desktop:** Fixed top header with nav tabs + content area
- **Mobile:** Fixed top header (hamburger + logo + bell + avatar) + content area + fixed bottom nav bar
- **Mobile drawer:** Slide-out navigation panel with all menu items
- **Brand colors:** Gradient header `#0f52a8 → #1b72d8 → #2e8af6`

### Component Conventions
- Loading states use shimmer skeletons (`PageSkeleton.tsx` and per-page `loading.tsx` files)
- Confirmation dialogs wrap destructive actions (`ConfirmSubmitButton.tsx`, `ClockButton.tsx`)
- Success feedback via `SuccessToast.tsx`
- Forms use standard HTML `<form>` with server actions

---

## 15. Key Business Rules

### Time Zone
All operations run in **IST (UTC+5:30)**. The time is computed client-agnostic via manual offset — not locale-dependent:
```typescript
export const nowIST = () => {
  const d = new Date()
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  return new Date(utc + 5.5 * 3600000)
}
```

### Employee Types & Schedules

| Type | Work Days | Daily Hours | Half-Day Morning Cutoff | Half-Day Afternoon Cutoff |
|------|-----------|-------------|------------------------|---------------------------|
| white_collar | Mon-Fri | 9 hours | 13:30 IST | 14:30 IST |
| blue_collar | Mon-Sat | 8 hours | 13:30 IST | 14:30 IST |

### Leave Rules
1. SL (Scheduled Leave): 18 days/year, carry forward up to 12 days
2. UL (Unscheduled Leave): 6 days/year, no carry forward
3. Half-day deductions: 0.5 day from UL first, then SL
4. When both SL and UL exhausted: salary deduction at 1.5x daily rate
5. UL auto-flagging: when attendance shows late/absent, auto-approved UL is created
6. Leave days calculation excludes weekends and public holidays

### Role Hierarchy
```
super_admin (top — does NOT have personal attendance)
    ↓
sub_super_admin (same access, but HAS personal attendance)
    ↓
admin (department-scoped — manages own team only)
    ↓
employee (self-service only)
```

### Geofence
- **Location:** Latitude 15.4023, Longitude 73.9867 (Goa office)
- **Radius:** 500 meters
- **Status:** Currently DISABLED in the clock-in flow
- **Implementation:** Haversine formula in `src/lib/attendance.ts`

---

## 16. Known Considerations & Technical Debt

1. **No automated tests** — There are no unit, integration, or E2E tests. Consider adding Playwright for critical flows (login, clock-in, leave request, reimbursement).

2. **Geofence disabled** — The geofence enforcement code exists but is disabled. To re-enable, modify the `clockInOut` server action in `attendance/page.tsx`.

3. **Tailwind unused at runtime** — Tailwind CSS is a dev dependency but all production styles are inline. This is by design but could be confusing for new developers.

4. **Large logo.ts file** — The company logo is a ~83KB base64 string in `src/lib/logo.ts`. Consider moving to a static file in `/public`.

5. **No database migrations versioning** — Schema changes are applied directly via Supabase dashboard. Consider implementing Supabase CLI migrations for better version control.

6. **Generated columns** — `sl_remaining` and `ul_remaining` in `leave_balances` are GENERATED. Any attempt to UPDATE these directly will fail. This has caused bugs in the past.

7. **IST time computation** — All time logic uses manual UTC offset (+5:30). This works but is fragile if DST rules ever change or if the app needs to support multiple timezones.

8. **No rate limiting** — API routes have no rate limiting beyond Supabase's built-in limits.

9. **Email delivery** — The Resend integration silently skips if the API key is missing. Check Resend dashboard for delivery failures.

10. **pg_cron functions** — The scheduled database functions (absent flagging, auto-checkout, monthly calculations) need to be verified as active in Supabase's pg_cron extension.

---

## 17. Maintenance Procedures

### Regular Maintenance Tasks

| Task | Frequency | How |
|------|-----------|-----|
| Check pg_cron jobs | Monthly | Supabase Dashboard → Database → Extensions → pg_cron |
| Review audit logs | Weekly | Query `audit_logs` table or build a UI |
| Verify email delivery | Weekly | Check Resend dashboard for bounces/failures |
| Check leave balances | Quarterly | Compare `leave_balances` rows against manual records |
| Year-end carry forward | Annually (Jan 1) | Verify `run_year_end_carry_forward()` ran correctly |
| Dependency updates | Quarterly | Run `npm outdated` and update carefully |
| Database backups | Automatic | Supabase handles daily backups (verify plan) |

### Adding a New Employee

1. Log in as super_admin
2. Navigate to `/manage/employees/new`
3. Fill in employee details (name, email, role, department, manager, employee type)
4. Submit — this creates Auth user + database row + leave balance
5. Share the default password (`IceCreamOps@123`) with the employee
6. Employee must change password on first login

### Updating Leave Balances

**Never update `sl_remaining` or `ul_remaining` directly.** Instead:
```sql
-- To adjust SL used
UPDATE leave_balances SET sl_used = <new_value> WHERE user_id = '<uuid>' AND year = 2026;

-- To adjust SL total (e.g., carry forward adjustment)
UPDATE leave_balances SET sl_total = <new_value> WHERE user_id = '<uuid>' AND year = 2026;

-- The remaining columns auto-recompute
```

### Database Schema Changes

1. Plan the migration
2. Test in a Supabase branch (if available) or local instance
3. Apply via Supabase Dashboard → SQL Editor
4. Update TypeScript types if needed
5. Deploy code changes that depend on schema changes AFTER the migration

---

## 18. Troubleshooting Guide

### "Login not working"
1. Check Supabase Auth dashboard for the user
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars
3. Check if user exists in both Supabase Auth AND `users` table
4. Check if `is_active = true` and `must_change_password` status

### "Leave balance shows wrong numbers"
1. Query `leave_balances` table directly — compare `sl_used`/`ul_used` with actual approved leave count
2. Count approved leaves: `SELECT COUNT(*), SUM(days_count) FROM leave_requests WHERE employee_id = '<id>' AND status = 'approved' AND year = 2026 GROUP BY leave_type`
3. Fix by updating `sl_used`/`ul_used` (NOT `sl_remaining`/`ul_remaining`)

### "Emails not sending"
1. Check `RESEND_API_KEY` is set in Vercel environment variables
2. Check Resend dashboard (https://resend.com) for delivery status
3. Check Vercel function logs for errors
4. Verify sender domain (`icestasyprojects.com`) is verified in Resend

### "Attendance not recording"
1. Check if user has `is_active = true`
2. Check if duplicate `attendance_logs` row exists for today (unique constraint on user_id + work_date)
3. Check Vercel function logs for server action errors
4. Verify IST time calculation is correct

### "RLS policy blocking data"
1. Check user's role in `users` table
2. Test query with service role key (bypasses RLS) to confirm data exists
3. Review RLS policies in Supabase Dashboard → Authentication → Policies
4. Check if `get_my_role()` and `get_my_team()` return expected values for the user

### "Build fails on Vercel"
1. Check Vercel build logs
2. Common causes: TypeScript errors, missing env vars, dependency conflicts
3. Run `npm run build` locally to reproduce
4. Check `next.config.ts` for any issues

---

## 19. Credentials & Access

### Access Checklist (New Tech Manager)

| Service | URL | What You Need |
|---------|-----|---------------|
| GitHub | github.com/Icestasy-Projects/hrms | Repository write access |
| Supabase | supabase.com/dashboard/project/avvqtcekupunqrbzbpcd | Project admin access |
| Vercel | vercel.com (project: hrms) | Team admin access |
| Resend | resend.com | Account access for email management |
| Domain DNS | (wherever icestasyprojects.com is hosted) | For email/DNS changes |

### Service Role Key Security

The `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL Row Level Security policies. It should:
- NEVER be exposed in client-side code
- NEVER be committed to version control
- ONLY be stored in Vercel environment variables and local `.env.local`
- Be rotated if ever compromised (Supabase Dashboard → Settings → API → Regenerate)

---

## 20. Version History

The application has undergone significant development. Key milestones:

| Version | Date | Key Changes |
|---------|------|-------------|
| v0.1 | Initial | Core attendance, leave, team management |
| v0.2 | 2026 | Reimbursement system, analytics, regularization redesign, performance optimization, onboarding, salary calculator, org chart, Vercel deployment, Excel export, audit logging |

### Recent Changes (Summary)

- Added full reimbursement module with claims, review, analytics, and Excel export
- Redesigned attendance regularization UI to card-based layout
- Added confirmation dialogs to all destructive actions across 17 files
- Performance optimization across all major pages
- Fixed multiple leave balance calculation bugs
- Added Reimbursement tile to dashboard
- Admin "All Claims" view for reimbursements
- Holiday leave management improvements
- Various bug fixes (RLS policies, login flow, manager assignments)

---

*This document should be kept updated as the system evolves. For questions, refer to the codebase comments, Supabase dashboard, and Vercel deployment logs.*
