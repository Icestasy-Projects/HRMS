import { describe, it, expect } from 'vitest'
import {
  computeAttendanceStatus,
  formatTime,
  haversineDistance,
  HALF_DAY_LATE_CUTOFF,
  HALF_DAY_EARLY_CUTOFF,
  SCHEDULE,
  OFFICE_LOCATION,
  GEOFENCE_RADIUS_M,
} from '../attendance'

describe('computeAttendanceStatus', () => {
  describe('absent', () => {
    it('returns absent when no check-in', () => {
      expect(computeAttendanceStatus(null, null)).toEqual({
        dayStatus: 'absent',
        isHalfDay: false,
      })
    })

    it('returns absent when check-in is null even with check-out', () => {
      expect(computeAttendanceStatus(null, '17:00:00')).toEqual({
        dayStatus: 'absent',
        isHalfDay: false,
      })
    })
  })

  describe('present (full day)', () => {
    it('returns present for normal check-in and check-out', () => {
      expect(computeAttendanceStatus('09:00:00', '18:00:00')).toEqual({
        dayStatus: 'present',
        isHalfDay: false,
      })
    })

    it('returns present for check-in just before late cutoff', () => {
      expect(computeAttendanceStatus('13:29:59', '18:00:00')).toEqual({
        dayStatus: 'present',
        isHalfDay: false,
      })
    })

    it('returns present for check-in at start of day', () => {
      expect(computeAttendanceStatus('08:00:00', '17:30:00')).toEqual({
        dayStatus: 'present',
        isHalfDay: false,
      })
    })

    it('returns present when check-out is exactly at early cutoff', () => {
      expect(computeAttendanceStatus('09:00:00', '14:30:00')).toEqual({
        dayStatus: 'present',
        isHalfDay: false,
      })
    })

    it('returns present with no check-out (still clocked in)', () => {
      expect(computeAttendanceStatus('09:00:00', null)).toEqual({
        dayStatus: 'present',
        isHalfDay: false,
      })
    })
  })

  describe('late arrival (half day — first half off)', () => {
    it('marks unscheduled half day for late arrival', () => {
      expect(computeAttendanceStatus('14:00:00', '18:00:00')).toEqual({
        dayStatus: 'unscheduled_half_day_first_off',
        isHalfDay: true,
      })
    })

    it('marks scheduled half day for late arrival with scheduled leave', () => {
      expect(computeAttendanceStatus('14:00:00', '18:00:00', true)).toEqual({
        dayStatus: 'scheduled_half_day_first_off',
        isHalfDay: true,
      })
    })

    it('marks late even without check-out yet', () => {
      expect(computeAttendanceStatus('15:00:00', null)).toEqual({
        dayStatus: 'unscheduled_half_day_first_off',
        isHalfDay: true,
      })
    })
  })

  describe('early departure (half day — second half off)', () => {
    it('marks unscheduled half day for early departure', () => {
      expect(computeAttendanceStatus('09:00:00', '13:00:00')).toEqual({
        dayStatus: 'unscheduled_half_day_second_off',
        isHalfDay: true,
      })
    })

    it('marks scheduled half day for early departure with scheduled leave', () => {
      expect(computeAttendanceStatus('09:00:00', '12:00:00', true)).toEqual({
        dayStatus: 'scheduled_half_day_second_off',
        isHalfDay: true,
      })
    })

    it('marks early departure at 14:29', () => {
      expect(computeAttendanceStatus('09:00:00', '14:29:00')).toEqual({
        dayStatus: 'unscheduled_half_day_second_off',
        isHalfDay: true,
      })
    })
  })

  describe('late arrival takes priority over early departure', () => {
    it('late + early returns late status (first half off)', () => {
      expect(computeAttendanceStatus('14:00:00', '13:00:00')).toEqual({
        dayStatus: 'unscheduled_half_day_first_off',
        isHalfDay: true,
      })
    })
  })
})

describe('SCHEDULE constants', () => {
  it('white collar has 5 days and 9 hours', () => {
    expect(SCHEDULE.white_collar.days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    expect(SCHEDULE.white_collar.hours_per_day).toBe(9)
  })

  it('blue collar has 6 days and 8 hours', () => {
    expect(SCHEDULE.blue_collar.days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    expect(SCHEDULE.blue_collar.hours_per_day).toBe(8)
  })
})

describe('HALF_DAY cutoffs', () => {
  it('late cutoff is 13:30', () => {
    expect(HALF_DAY_LATE_CUTOFF).toBe('13:30')
  })

  it('early cutoff is 14:30', () => {
    expect(HALF_DAY_EARLY_CUTOFF).toBe('14:30')
  })
})

describe('formatTime', () => {
  it('formats HH:MM:SS to HH:MM', () => {
    expect(formatTime('09:30:00')).toBe('09:30')
  })

  it('formats time from ISO datetime', () => {
    expect(formatTime('2025-01-06T14:15:30.000Z')).toBe('14:15')
  })

  it('returns --:-- for null', () => {
    expect(formatTime(null)).toBe('--:--')
  })

  it('handles HH:MM input', () => {
    expect(formatTime('08:45')).toBe('08:45')
  })
})

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance(15.4023, 73.9867, 15.4023, 73.9867)).toBe(0)
  })

  it('calculates distance between two known points', () => {
    // Mumbai to Goa is roughly 400-500km
    const dist = haversineDistance(19.076, 72.8777, 15.2993, 74.124)
    expect(dist).toBeGreaterThan(400_000)
    expect(dist).toBeLessThan(500_000)
  })

  it('recognizes office location within geofence', () => {
    // Point ~100m from office
    const nearbyLat = OFFICE_LOCATION.lat + 0.0009  // ~100m
    const dist = haversineDistance(
      OFFICE_LOCATION.lat, OFFICE_LOCATION.lng,
      nearbyLat, OFFICE_LOCATION.lng,
    )
    expect(dist).toBeLessThan(GEOFENCE_RADIUS_M)
  })

  it('recognizes point outside geofence', () => {
    // Point ~1km from office
    const farLat = OFFICE_LOCATION.lat + 0.009
    const dist = haversineDistance(
      OFFICE_LOCATION.lat, OFFICE_LOCATION.lng,
      farLat, OFFICE_LOCATION.lng,
    )
    expect(dist).toBeGreaterThan(GEOFENCE_RADIUS_M)
  })
})
