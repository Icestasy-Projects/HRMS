export type EmployeeType = 'white_collar' | 'blue_collar'
export type UserRole = 'employee' | 'admin' | 'super_admin'
export type LeaveType = 'scheduled' | 'unscheduled'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'holiday' | 'weekend'

export interface Department {
  id: string
  name: string
  manager_id: string | null
  created_at: string
}

export interface Employee {
  id: string
  user_id: string
  full_name: string
  email: string
  employee_type: EmployeeType
  role: UserRole
  department_id: string | null
  department?: Department
  is_active: boolean
  created_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: AttendanceStatus
  is_half_day: boolean
  notes: string | null
  created_at: string
}

export interface AttendanceWithNames {
  id: string
  employee_id: string
  full_name: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: AttendanceStatus
  is_half_day: boolean
  notes: string | null
  department_name: string | null
}

export interface LeaveRequest {
  id: string
  employee_id: string
  employee?: Employee
  leave_type: LeaveType
  start_date: string
  end_date: string
  is_half_day: boolean
  status: LeaveStatus
  approved_by: string | null
  approver?: Employee
  reason: string | null
  days_requested: number
  days_deducted: number | null
  created_at: string
  updated_at: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  year: number
  scheduled_total: number
  scheduled_used: number
  scheduled_balance: number
  unscheduled_total: number
  unscheduled_used: number
  unscheduled_balance: number
  carried_forward: number
  created_at: string
  updated_at: string
}

export interface LeavePolicy {
  id: string
  scheduled_days: number
  unscheduled_days: number
  max_carryforward: number
  half_day_scheduled_cost: number
  half_day_unscheduled_cost: number
  unpaid_multiplier: number
  updated_at: string
}

export interface HolidayCalendar {
  id: string
  date: string
  name: string
  description: string | null
  created_at: string
}

export interface Notification {
  id: string
  recipient_id: string
  sender_id: string | null
  message: string
  requires_action: boolean
  is_read: boolean
  leave_request_id: string | null
  leave_request?: LeaveRequest
  created_at: string
}

export interface TallyExportLog {
  id: string
  exported_by: string
  period_start: string
  period_end: string
  status: 'pending' | 'completed' | 'failed'
  file_url: string | null
  created_at: string
}

export interface WeeklyHourSummary {
  employee_id: string
  full_name: string
  week_start: string
  week_end: string
  total_hours: number
  expected_hours: number
  attendance_days: number
}
