import { describe, it, expect } from 'vitest'
import {
  countWorkdays,
  carryforwardWarning,
  unpaidLeaveWarning,
  DEFAULT_SL_TOTAL,
  DEFAULT_UL_TOTAL,
} from '../leave'

describe('countWorkdays', () => {
  it('counts weekdays in a simple Mon-Fri week', () => {
    // 2025-01-06 (Mon) to 2025-01-10 (Fri) = 5 weekdays
    expect(countWorkdays('2025-01-06', '2025-01-10')).toBe(5)
  })

  it('returns 1 for a single weekday', () => {
    expect(countWorkdays('2025-01-06', '2025-01-06')).toBe(1) // Monday
  })

  it('returns 0 for a single Saturday', () => {
    expect(countWorkdays('2025-01-04', '2025-01-04')).toBe(0)
  })

  it('returns 0 for a single Sunday', () => {
    expect(countWorkdays('2025-01-05', '2025-01-05')).toBe(0)
  })

  it('skips weekends in a two-week range', () => {
    // 2025-01-06 (Mon) to 2025-01-17 (Fri) = 10 weekdays
    expect(countWorkdays('2025-01-06', '2025-01-17')).toBe(10)
  })

  it('excludes public holidays', () => {
    // Mon-Fri week with one holiday on Wednesday
    expect(countWorkdays('2025-01-06', '2025-01-10', ['2025-01-08'])).toBe(4)
  })

  it('excludes multiple holidays', () => {
    expect(countWorkdays('2025-01-06', '2025-01-10', ['2025-01-07', '2025-01-09'])).toBe(3)
  })

  it('ignores holidays that fall on weekends', () => {
    // Holiday on Saturday should not reduce count
    expect(countWorkdays('2025-01-06', '2025-01-10', ['2025-01-04'])).toBe(5)
  })

  it('handles a full month correctly', () => {
    // January 2025: 23 weekdays (31 days, starts on Wed)
    expect(countWorkdays('2025-01-01', '2025-01-31')).toBe(23)
  })

  it('handles February in a non-leap year', () => {
    // February 2025: 20 weekdays (28 days, starts on Sat)
    expect(countWorkdays('2025-02-01', '2025-02-28')).toBe(20)
  })

  it('handles February in a leap year', () => {
    // February 2024: 21 weekdays (29 days, starts on Thu)
    expect(countWorkdays('2024-02-01', '2024-02-29')).toBe(21)
  })

  it('returns 0 when all days are holidays', () => {
    expect(countWorkdays('2025-01-06', '2025-01-06', ['2025-01-06'])).toBe(0)
  })

  it('returns 0 for start > end', () => {
    expect(countWorkdays('2025-01-10', '2025-01-06')).toBe(0)
  })

  it('handles year boundary correctly', () => {
    // 2024-12-29 = Sun, 30=Mon, 31=Tue, 2025-01-01=Wed, 02=Thu, 03=Fri
    // Weekdays: 30,31,1,2,3 = 5
    expect(countWorkdays('2024-12-29', '2025-01-03')).toBe(5)
  })

  it('handles Indian Independence Day scenario', () => {
    // Aug 15, 2025 is a Friday
    const holidays = ['2025-08-15']
    // Aug 11 (Mon) to Aug 15 (Fri) = 4 weekdays (5 minus holiday)
    expect(countWorkdays('2025-08-11', '2025-08-15', holidays)).toBe(4)
  })
})

describe('leave balance defaults', () => {
  it('has correct SL default', () => {
    expect(DEFAULT_SL_TOTAL).toBe(18)
  })

  it('has correct UL default', () => {
    expect(DEFAULT_UL_TOTAL).toBe(6)
  })
})

describe('carryforwardWarning', () => {
  it('returns null before October', () => {
    const realDate = Date
    const mockDate = new Date('2025-06-15T00:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
    expect(carryforwardWarning(15)).toBeNull()
    vi.useRealTimers()
  })

  it('returns null in October with balance <= 12', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-10-15T00:00:00Z'))
    expect(carryforwardWarning(12)).toBeNull()
    vi.useRealTimers()
  })

  it('returns warning in October with balance > 12', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-10-15T00:00:00Z'))
    const result = carryforwardWarning(15)
    expect(result).not.toBeNull()
    expect(result).toContain('15 scheduled days left')
    expect(result).toContain('12 carry forward')
    vi.useRealTimers()
  })

  it('returns warning in December with high balance', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'))
    expect(carryforwardWarning(18)).not.toBeNull()
    vi.useRealTimers()
  })
})

describe('unpaidLeaveWarning', () => {
  it('returns null when balances are positive', () => {
    expect(unpaidLeaveWarning(5, 3)).toBeNull()
  })

  it('returns null when only one balance is zero', () => {
    expect(unpaidLeaveWarning(0, 3)).toBeNull()
    expect(unpaidLeaveWarning(5, 0)).toBeNull()
  })

  it('returns warning when both balances are zero', () => {
    const result = unpaidLeaveWarning(0, 0)
    expect(result).not.toBeNull()
    expect(result).toContain('1.5×')
  })
})
