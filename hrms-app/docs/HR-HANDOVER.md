# HR Handover Document — HRMS Application

**Prepared for:** HR Head / HR Manager  
**Application:** Icestasy HRMS (Human Resource Management System)  
**Access URL:** https://hrms-kappa-nine.vercel.app  
**Date:** November 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Access & Roles](#2-system-access--roles)
3. [Employee Management](#3-employee-management)
4. [Attendance System](#4-attendance-system)
5. [Leave Management](#5-leave-management)
6. [Reimbursement Management](#6-reimbursement-management)
7. [Team & Organization](#7-team--organization)
8. [Onboarding](#8-onboarding)
9. [Holiday Calendar](#9-holiday-calendar)
10. [Separation / Exit Management](#10-separation--exit-management)
11. [Salary & Payroll](#11-salary--payroll)
12. [Notifications & Alerts](#12-notifications--alerts)
13. [Reports & Exports](#13-reports--exports)
14. [Daily HR Operations Checklist](#14-daily-hr-operations-checklist)
15. [Common Scenarios & How-Tos](#15-common-scenarios--how-tos)
16. [Leave Policy Reference](#16-leave-policy-reference)
17. [Employee Types & Schedules](#17-employee-types--schedules)
18. [Frequently Asked Questions](#18-frequently-asked-questions)
19. [Escalation & Support](#19-escalation--support)

---

## 1. Introduction

The Icestasy HRMS is the company's centralized system for managing all HR operations. It is a web application accessible at **https://hrms-kappa-nine.vercel.app** from any browser (desktop or mobile).

The system handles:
- Employee attendance tracking (clock in/out)
- Leave applications and approvals
- Reimbursement claims and approvals
- Employee onboarding
- Team management and org chart
- Holiday calendar
- Separation (resignation/sabbatical) requests
- Salary calculations and payroll summaries
- Notifications and email alerts

**All employees access the system via their company email and password.** New employees receive a default password and must change it on first login.

---

## 2. System Access & Roles

### How to Log In
1. Open https://hrms-kappa-nine.vercel.app
2. Enter your company email address
3. Enter your password
4. Click "Sign In"

### Forgot Password
- Click "Forgot Password" on the login page
- Enter your email address
- Check your inbox for a reset link
- Set a new password

### User Roles

The system has four roles, each with different access levels:

| Role | Who | What They Can Do |
|------|-----|------------------|
| **Super Admin** | System Owner / CEO | Everything: manage all employees, departments, policies, holidays, view all data. Does NOT have personal attendance tracking. |
| **Sub Super Admin** | HR Head / Senior Management | Same as Super Admin, but ALSO has personal attendance and leave tracking. |
| **Admin** | Department Heads / Team Leads | Manage their own team: approve leaves, view team attendance, review reimbursements. Also has own attendance/leave. |
| **Employee** | All staff members | Self-service: clock in/out, apply for leave, submit reimbursements, view team calendar. |

### What Each Role Can See

| Feature | Super Admin | Sub Super Admin | Admin | Employee |
|---------|:-----------:|:---------------:|:-----:|:--------:|
| Dashboard | Yes | Yes | Yes | Yes |
| Own Attendance | No | Yes | Yes | Yes |
| Own Leave | No | Yes | Yes | Yes |
| Reimbursement | Yes | Yes | Yes | Yes |
| Approve Team Leaves | Yes (all) | Yes (all) | Yes (own team) | No |
| Approve Reimbursements | Yes | Yes | Yes (own team) | No |
| Manage Employees | Yes | Yes | No | No |
| Manage Departments | Yes | Yes | No | No |
| Manage Holidays | Yes | Yes | No | No |
| Manage Leave Policy | Yes | Yes | No | No |
| View All Leave Balances | Yes | Yes | No | No |
| Org Chart | Yes | Yes | Yes | No |
| Salary Calculator | Yes | Yes | Yes | No |
| Hours Tracker | Yes | Yes | No | No |
| Onboarding | Yes | Yes | No | No |
| Separation Approvals | Yes | Yes | No | No |
| Analytics | Yes | Yes | No | No |

---

## 3. Employee Management

### Adding a New Employee

**Who can do this:** Super Admin, Sub Super Admin

**Steps:**
1. Navigate to **Manage** → **Employees** → **Add New Employee**
2. Fill in the form:
   - **Name** — Full name
   - **Email** — Company email (this becomes their login)
   - **Phone** — Contact number (optional)
   - **Role** — Select: employee, admin, sub_super_admin, or super_admin
   - **Employee Type** — White Collar (Mon-Fri, 9h/day) or Blue Collar (Mon-Sat, 8h/day)
   - **Department** — Select from existing departments
   - **Manager** — Select their reporting manager
   - **Daily Salary** — Used for payroll calculations
   - **Location** — Office location
3. Click **Create Employee**
4. The system will:
   - Create their login account with the default password: **IceCreamOps@123**
   - Automatically create their annual leave balance (18 SL + 6 UL)
   - Set a flag requiring them to change password on first login

**Important:** Share the default password with the new employee securely. They will be forced to create their own password on first login.

### Editing an Employee

1. Navigate to **Manage** → **Employees**
2. Click on the employee's name or the edit button
3. Update fields as needed (name, role, department, manager, salary, etc.)
4. Save changes

### Deactivating an Employee

When an employee leaves the organization:
1. Navigate to **Manage** → **Employees** → Click the employee
2. Set **Is Active** to false (or set an exit date)
3. Their login will be disabled but records are preserved for historical reporting

---

## 4. Attendance System

### How Attendance Works

Employees clock in and out daily using the **Time & Attendance** page:

1. Employee clicks **Clock In** when starting work
2. Employee clicks **Clock Out** when ending work
3. The system records:
   - Check-in time
   - Check-out time
   - Hours worked
   - Day status (present, half-day, absent, etc.)

### Work Schedules

| Employee Type | Work Days | Required Daily Hours |
|---------------|-----------|---------------------|
| **White Collar** | Monday to Friday | 9 hours |
| **Blue Collar** | Monday to Saturday | 8 hours |

### Half-Day Rules

The system **automatically** detects half-days:

| Situation | Rule | What Happens |
|-----------|------|-------------|
| Late arrival | Clock in after **1:30 PM IST** | Marked as half-day (first half off) |
| Early departure | Clock out before **2:30 PM IST** | Marked as half-day (second half off) |

When a half-day is detected:
- The system auto-deducts **0.5 days of Unscheduled Leave (UL)**
- If UL is exhausted, it deducts from **Scheduled Leave (SL)** instead
- If both are exhausted, a **salary deduction at 1.5x daily rate** is applied

### Monthly Hours Tracker

Each employee can see a progress bar on their attendance page showing:
- Total hours worked this month
- Required hours for the month
- Deficit or surplus hours

### Weekend Work

Employees can clock in on weekends. This is tracked separately as "weekend work" and does not count against regular schedule.

### Attendance Regularization

If an employee's attendance was recorded incorrectly (forgot to clock out, system error, etc.):

1. Employee goes to **Attendance Regularization**
2. Selects the date and field to correct
3. Enters the correct value and reason
4. Submits the request
5. **Admin/Super Admin** reviews and approves or rejects the correction

### Viewing Team Attendance (Admin/HR)

- Navigate to **Team** → **Hours Tracker** to see all employees' hours
- Click on individual employees for detailed daily records
- Use the monthly view to identify patterns (chronic lateness, missing checkouts)

### Geofence (Currently Disabled)

The system has a built-in geofence feature (500m radius around the Goa office at coordinates 15.4023°N, 73.9867°E) that can restrict clock-in to office proximity. **This is currently turned off.** The tech team can re-enable it if needed.

---

## 5. Leave Management

### Leave Types

| Type | Code | Annual Quota | Description |
|------|------|-------------|-------------|
| **Scheduled Leave (SL)** | SL | **18 days/year** | Planned leave — apply in advance. Carries forward up to 12 days. |
| **Unscheduled Leave (UL)** | UL | **6 days/year** | Sick leave, emergencies, or auto-deducted for late arrival. Does NOT carry forward. |

### How Employees Apply for Leave

1. Navigate to **Leave** → **Request Leave**
2. Select leave type: SL or UL
3. Select duration: Full Day or Half Day
4. Pick start date and end date
5. Enter a reason
6. Submit

**What happens after submission:**
- The employee's manager receives an **email notification**
- The request appears in the manager's **Leave Requests** approval queue
- For UL (sick/emergency leave), the system **auto-approves** the request
- For SL (scheduled leave), the manager must manually approve or reject

### Leave Approval Workflow

**For Admins/HR:**
1. Navigate to **Team** → **Leave Requests**
2. You'll see all pending leave requests from your team (or all employees if Super Admin)
3. Review each request:
   - Employee name, leave type, dates, reason
   - Current leave balance
4. Click **Approve** or **Reject** (with reason for rejection)
5. The employee receives an **email notification** of the decision

### Leave Balance Overview

**For HR/Super Admin:**
- Navigate to **Team** → **Leave Overview** to see all employees' balances
- Click on an employee for detailed leave history
- Balances show: total allowed, used, remaining

### Auto-Deduction Rules

| Scenario | Automatic Action |
|----------|------------------|
| Employee arrives after 1:30 PM | 0.5 UL deducted, auto-approved |
| Employee leaves before 2:30 PM | 0.5 UL deducted, auto-approved |
| Employee absent (no clock-in) | Full-day UL deducted, auto-approved |
| UL balance reaches 0 | Further deductions come from SL |
| Both SL and UL at 0 | Salary deduction at **1.5x daily rate** |

### Year-End Leave Carry Forward

At the end of each calendar year:
- **SL:** Up to **12 days** carry forward to the next year
- **SL excess:** Any SL above 12 days is forfeited
- **UL:** Does NOT carry forward (use it or lose it)

---

## 6. Reimbursement Management

### How Employees Submit Claims

1. Navigate to **Reimbursement** → **New Claim**
2. Fill in:
   - **Expense Date** — When the expense occurred
   - **Category** — Travel, Meals, Accommodation, Office Supplies, Communication, Training, Medical, or Other
   - **Purpose** — Brief description
   - **Amount** — INR amount
3. Can add multiple line items in one submission (they share a batch ID)
4. Click **Submit**

### Reimbursement Review (Admin/HR)

1. Navigate to **Reimbursement** → Click the **Review** tab
2. See all pending claims from your team (or all employees if Super Admin)
3. Review each item:
   - Employee name, date, category, purpose, amount
4. Click **Approve** or **Reject** (with notes for rejection)

### Reimbursement Categories

| Category | Examples |
|----------|----------|
| Travel | Cab/auto fares, fuel, train/bus tickets |
| Meals | Client lunch, team dinner, working meals |
| Accommodation | Hotel stays for work trips |
| Office Supplies | Stationery, equipment, software |
| Communication | Phone bills, internet for WFH |
| Training | Course fees, certification costs |
| Medical | Medical expenses (if not covered by insurance) |
| Other | Any other work-related expense |

### All Claims View (Super Admin only)

Super Admins can see the **All Claims** tab showing every reimbursement across the organization with search and filter capabilities.

### Analytics (Super Admin only)

The **Analytics** tab provides:
- Per-employee spending summary cards
- Bar charts showing spending over time
- Category-wise breakdown
- Total approved/pending/rejected amounts

### Excel Export

Admins can export all reimbursement data to Excel:
- Click the **Export to Excel** button
- Downloads a `.xlsx` file with all claims, employee details, dates, categories, amounts, and statuses

---

## 7. Team & Organization

### Team Directory

Navigate to **Team** to see:
- All employees in your team (or all employees if Super Admin)
- Filter by department
- View employee details (name, role, department, contact)

### Org Chart

Navigate to **Team** → **Org Chart** to see:
- Visual hierarchy of the organization
- Reporting lines (who reports to whom)
- Department groupings

### Team Calendar

Navigate to **Team Calendar** to see:
- Who is on leave today/upcoming
- Holiday schedule
- Team availability at a glance

**This is visible to ALL users** — employees can check team availability before planning their leave.

---

## 8. Onboarding

### Setting Up Onboarding Templates

**Who can do this:** Super Admin, Sub Super Admin

1. Navigate to **Manage** → **Onboarding**
2. Click **New Template**
3. Create a checklist template with:
   - Template name (e.g., "Software Engineer Onboarding")
   - Individual task items (e.g., "Set up email", "Get ID card", "Complete compliance training")
4. Save the template

### Assigning Onboarding to New Employees

1. Navigate to **Manage** → **Onboarding**
2. Select the new employee
3. Assign a template
4. Track progress as tasks are completed

### Tracking Onboarding Progress

- View completion percentage for each employee
- See which tasks are done and which are pending
- Follow up on overdue items

---

## 9. Holiday Calendar

### Viewing Holidays

All employees can view the holiday calendar at **Public Holidays**.

### Managing Holidays (Admin/HR)

**Who can do this:** Super Admin, Sub Super Admin

1. Navigate to **Manage** → **Holidays**
2. **Add Holiday:**
   - Enter date, holiday name
   - Select type: Public, Company, or Optional
3. **Edit Holiday:** Click on an existing holiday to modify
4. **Delete Holiday:** Remove incorrect entries

### Holiday Types

| Type | Description | Effect on Leave |
|------|-------------|----------------|
| **Public** | Government/national holidays | Not counted as leave days. Everyone off. |
| **Company** | Company-specific holidays | Not counted as leave days. Everyone off. |
| **Optional** | Optional/restricted holidays | Employees choose whether to take them. |

**Important:** Public holidays are automatically excluded when calculating leave days. If an employee takes leave from Monday to Friday and Wednesday is a public holiday, only 4 days of leave are deducted (not 5).

---

## 10. Separation / Exit Management

### How Employees Submit Resignation or Sabbatical

1. Navigate to **Leave** → **Resignation / Sabbatical**
2. Select type: Resignation or Sabbatical
3. Enter:
   - Proposed last working date
   - Reason
   - Any notes
4. Submit the request

### Approving Separation Requests (HR)

1. Navigate to **Team** → **Separation Requests**
2. Review each request
3. Approve, reject, or request modifications
4. Coordinate with the employee on handover, notice period, etc.

### Exit Process Checklist (Manual)
- [ ] Approve separation request in HRMS
- [ ] Set employee exit date in **Manage** → **Employees**
- [ ] Ensure all reimbursement claims are settled
- [ ] Calculate final leave balance / encashment
- [ ] Deactivate employee account (`is_active = false`)
- [ ] Revoke access to company tools and systems

---

## 11. Salary & Payroll

### Salary Calculator

Navigate to **Manage** → **Salary Calculator** to:
- Calculate monthly salary for any employee
- Factor in: daily rate, working days, leaves taken, deductions
- Preview payroll before processing

### Monthly Payroll Summaries

The system automatically generates monthly summaries including:
- Total working days
- Days present / absent / on leave
- Hours worked vs. required
- Leave deductions (SL/UL used)
- Salary deductions (if leave exceeded)
- Overtime / deficit hours

### Salary Deduction Rules

| Scenario | Deduction |
|----------|-----------|
| SL or UL used | No salary deduction (covered by leave balance) |
| Leave taken beyond SL+UL quota | **1.5x daily salary** per excess day |
| Half-day deduction beyond quota | **0.75x daily salary** (half of 1.5x) |

### Tally Export

Monthly payroll data can be exported for the Tally accounting system. The system tracks which months have been calculated and exported.

---

## 12. Notifications & Alerts

### In-App Notifications

Navigate to **Notifications** (bell icon) to see:
- Leave request submissions (for managers)
- Leave approval/rejection decisions (for employees)
- Hour deficit warnings
- Salary deduction alerts
- Monthly payroll calculation alerts
- Tally export readiness

### Email Notifications

The system sends automatic emails for:
| Event | Email Sent To |
|-------|---------------|
| Employee applies for leave | Employee's manager |
| Manager approves leave | The employee |
| Manager rejects leave | The employee |
| Auto-deducted leave (late arrival) | Employee's manager |

### Notification Badge

The dashboard and navigation show a notification count badge (bell icon with number) for unread notifications.

---

## 13. Reports & Exports

### Available Reports

| Report | Access | Location |
|--------|--------|----------|
| Personal Attendance History | All employees | Attendance → My Attendance Log |
| Personal Leave History | All employees | Leave → Leave History |
| Team Leave Overview | Super Admin, Sub Super Admin | Team → Leave Overview |
| Employee Hours Tracker | Super Admin, Sub Super Admin | Team → Hours Tracker |
| Reimbursement Analytics | Super Admin | Reimbursement → Analytics tab |
| Reimbursement Excel Export | Admin+ | Reimbursement → Export button |
| Monthly Payroll Summary | Super Admin, Sub Super Admin | (via salary calculator) |

### Reimbursement Export

1. Navigate to **Reimbursement**
2. Click **Export to Excel**
3. Downloads an `.xlsx` file containing:
   - Employee Name
   - Email
   - Batch ID
   - Expense Date
   - Category
   - Purpose
   - Amount (INR)
   - Status
   - Submitted On

---

## 14. Daily HR Operations Checklist

### Morning Routine
- [ ] Log in to HRMS
- [ ] Check **Notifications** for any overnight alerts
- [ ] Review **Leave Requests** — approve or reject pending requests
- [ ] Review **Reimbursement** → Review tab — approve or reject pending claims
- [ ] Check **Regularization Requests** — approve attendance corrections

### Weekly Tasks
- [ ] Review **Team** → **Hours Tracker** — identify employees with hour deficits
- [ ] Review **Leave Overview** — check employees running low on leave
- [ ] Follow up on pending **Separation Requests**
- [ ] Review **Attendance Regularization** requests

### Monthly Tasks
- [ ] Verify **monthly payroll summaries** are generated correctly
- [ ] Export **reimbursement data** for accounting
- [ ] Review leave balance accuracy across all employees
- [ ] Check for any employees who exceeded their leave quota (salary deduction needed)
- [ ] Update **Holiday Calendar** for upcoming month if needed

### Quarterly Tasks
- [ ] Review and update **Leave Policy** settings if needed
- [ ] Audit employee records for accuracy (departments, managers, roles)
- [ ] Check onboarding templates are up to date

### Annual Tasks (Year End / Year Start)
- [ ] Verify **leave carry forward** processed correctly (max 12 SL days)
- [ ] Ensure new year's **leave balances** are created for all active employees
- [ ] Update **Holiday Calendar** for the new year
- [ ] Review and update salary rates if applicable

---

## 15. Common Scenarios & How-Tos

### Scenario: Employee says "My leave balance is wrong"

1. Navigate to **Team** → **Leave Overview** → Click the employee
2. Check their current balance (SL remaining, UL remaining)
3. Review their leave history for the year
4. Common causes:
   - Auto-deducted half-days (from late arrival) that the employee didn't realize
   - Leave requests that were auto-approved (UL type)
   - Carry-forward amounts from previous year
5. If a correction is needed, contact the tech team to adjust `sl_used` or `ul_used` in the database

### Scenario: Employee forgot to clock out

1. Employee should submit an **Attendance Regularization** request
2. As admin, navigate to **Team** → **Regularization Requests**
3. Review the request (verify with security/camera logs if needed)
4. Approve the correction — the system updates the attendance record

### Scenario: New employee can't log in

1. Verify you created their account in **Manage** → **Employees**
2. Confirm the email is correct (this is their username)
3. Remind them the default password is **IceCreamOps@123**
4. If still failing, contact the tech team to check Supabase Auth

### Scenario: Employee on maternity/paternity leave

1. The current system doesn't have a separate maternity/paternity leave type
2. Use SL for such leaves
3. If exceeding the annual quota, coordinate with management on policy exceptions
4. The tech team can adjust leave balances manually if approved by management

### Scenario: Employee transferred to a different department

1. Navigate to **Manage** → **Employees** → Click the employee
2. Update their **Department** field
3. Update their **Manager** (if changing)
4. Their leave balances and attendance history are preserved

### Scenario: Public holiday falls during someone's approved leave

No action needed! The system automatically excludes public holidays when calculating leave days. If an employee has approved leave from Dec 23-27 and Dec 25 is a holiday, only 4 days of leave are deducted.

### Scenario: Employee used all their leave and is still absent

1. The system will start **salary deductions at 1.5x daily rate**
2. This is tracked in the monthly payroll summary
3. Review in **Salary Calculator** → calculate the employee's monthly pay
4. The deduction is automatically factored in

### Scenario: Need to add a holiday that was announced suddenly

1. Navigate to **Manage** → **Holidays**
2. Click **Add Holiday**
3. Enter the date, name, and type (Public/Company/Optional)
4. Save
5. If employees had approved leave on that date, the system will account for it in calculations

---

## 16. Leave Policy Reference

### Annual Leave Entitlements

| Leave Type | Annual Quota | Carry Forward | Notes |
|-----------|-------------|---------------|-------|
| Scheduled Leave (SL) | 18 days | Up to 12 days to next year | Plan in advance, requires manager approval |
| Unscheduled Leave (UL) | 6 days | None (use or lose) | Sick/emergency, auto-approved by system |

### Leave Calculation Rules

1. **Full-day leave** = 1 day deducted
2. **Half-day leave** = 0.5 days deducted
3. **Weekends excluded** — Leave spanning a weekend doesn't count weekend days
4. **Holidays excluded** — Public holidays within leave period are not counted
5. **UL auto-deduction** — Late arrival or early departure auto-deducts 0.5 UL
6. **Overflow rule** — When UL exhausted, auto-deductions come from SL
7. **Salary cut** — When both SL and UL exhausted, deduction at 1.5x daily salary

### Half-Day Cutoff Times

| Cutoff | Time | Meaning |
|--------|------|--------|
| Morning cutoff | **1:30 PM IST** | Arrive after this = first-half marked off |
| Afternoon cutoff | **2:30 PM IST** | Leave before this = second-half marked off |

### Carry Forward Rules

At year end (January 1):
- SL remaining (up to 12 days) → carried to next year's SL balance
- SL remaining above 12 → forfeited
- UL remaining → forfeited (no carry forward)

---

## 17. Employee Types & Schedules

### White Collar Employees

| Attribute | Value |
|-----------|-------|
| Work Days | Monday to Friday |
| Daily Hours | 9 hours |
| Monthly working days | ~22 days |
| Schedule | Flexible (but half-day rules apply) |

### Blue Collar Employees

| Attribute | Value |
|-----------|-------|
| Work Days | Monday to Saturday |
| Daily Hours | 8 hours |
| Monthly working days | ~26 days |
| Schedule | Fixed shift (half-day rules apply) |

### Changing Employee Type

If an employee's type needs to change (e.g., promoted from blue collar to white collar):
1. Navigate to **Manage** → **Employees** → Click the employee
2. Change the **Employee Type** field
3. Save — the new schedule rules apply going forward

---

## 18. Frequently Asked Questions

**Q: Can employees clock in from home/remotely?**  
A: Currently yes — the geofence (office location restriction) is turned off. If you want to restrict clock-in to the office, ask the tech team to enable the geofence feature.

**Q: What happens if an employee forgets to clock in?**  
A: The system runs an automated check at end of day. Employees with no clock-in are flagged as absent, and a full-day UL is auto-deducted. They can submit a regularization request to correct it.

**Q: What happens if an employee forgets to clock out?**  
A: The system auto-checks-out at end of day. The employee can submit a regularization request with the correct check-out time.

**Q: Can I manually adjust an employee's leave balance?**  
A: Not through the UI directly. Contact the tech team to make database adjustments. Never adjust the "remaining" fields — only "used" or "total" fields can be changed.

**Q: How do I handle leave for employees who join mid-year?**  
A: Currently, all employees get the full annual quota (18 SL + 6 UL) regardless of join date. The tech team can pro-rate if needed by adjusting the sl_total/ul_total values.

**Q: Can employees apply for leave in the past?**  
A: The system allows past-date leave requests. Managers can approve or reject based on company policy.

**Q: How are overlapping leaves handled?**  
A: The system doesn't prevent overlapping leave requests. Review leave requests carefully to catch any date overlaps.

**Q: Can I see who is on leave today?**  
A: Yes! Check the **Team Calendar** — it shows who is on leave and who is present.

**Q: Where can I see salary deductions for excessive leave?**  
A: In the **Salary Calculator** under Manage, or in the monthly payroll summaries. The system tracks these automatically.

**Q: Can I create custom leave types (maternity, paternity, etc.)?**  
A: Not currently. The system supports only SL and UL. Custom leave types would need tech development. For now, use SL and adjust balances manually for special cases.

**Q: How do I export data for the finance team?**  
A: Use the **Export to Excel** button in the Reimbursement section. For payroll data, use the Salary Calculator or monthly summaries.

**Q: Can employees see each other's leave balances?**  
A: No. Employees can only see their own data. Admins see their team's data. Super Admins see all data.

---

## 19. Escalation & Support

### For System Issues

| Issue Type | Who to Contact |
|-----------|----------------|
| Can't log in | Tech team (check Supabase Auth) |
| Wrong leave balance | Tech team (database adjustment) |
| System error / page not loading | Tech team (check Vercel logs) |
| Need a new feature | Tech team (development request) |
| Email notifications not working | Tech team (check Resend service) |

### For Process Issues

| Issue Type | How to Handle |
|-----------|---------------|
| Leave policy exception | Discuss with management, then adjust balances |
| Disputed attendance | Review regularization request, check records |
| Salary dispute | Review monthly summary, verify leave calculations |
| Onboarding issues | Update templates, assign tasks manually |

### System Access Requirements

To manage the HRMS effectively, ensure the HR Head has:
- [ ] **Sub Super Admin** role in the HRMS system
- [ ] Access to the Supabase dashboard (for emergency data checks)
- [ ] Knowledge of the default employee password: **IceCreamOps@123**
- [ ] Contact details for the tech team managing the system

---

### Key Contacts & Services

| Service | Purpose | Access |
|---------|---------|--------|
| HRMS Web App | Main application | https://hrms-kappa-nine.vercel.app |
| Supabase Dashboard | Database management (emergency) | https://supabase.com/dashboard |
| Vercel Dashboard | Deployment management | https://vercel.com |
| Resend | Email delivery monitoring | https://resend.com |

---

*This document is a living reference. Update it as policies change and new features are added to the HRMS system.*
