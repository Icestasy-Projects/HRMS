import { describe, it, expect, vi, beforeEach } from 'vitest'
import { log } from '../logger'

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('module loggers exist', () => {
    const modules = [
      'audit', 'auth', 'attendance', 'leave', 'email',
      'holiday', 'notification', 'reimbursement',
      'regularization', 'separation', 'request',
    ] as const

    for (const mod of modules) {
      it(`has ${mod} logger with info/warn/error`, () => {
        expect(log[mod]).toBeDefined()
        expect(typeof log[mod].info).toBe('function')
        expect(typeof log[mod].warn).toBe('function')
        expect(typeof log[mod].error).toBe('function')
      })
    }
  })

  describe('info', () => {
    it('emits structured JSON to console.log', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      log.attendance.info('Test message', { userId: '123' })

      expect(spy).toHaveBeenCalledOnce()
      const parsed = JSON.parse(spy.mock.calls[0][0])
      expect(parsed.level).toBe('info')
      expect(parsed.module).toBe('attendance')
      expect(parsed.message).toBe('Test message')
      expect(parsed.data).toEqual({ userId: '123' })
      expect(parsed.timestamp).toBeDefined()
    })
  })

  describe('warn', () => {
    it('emits structured JSON to console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      log.email.warn('Missing API key')

      expect(spy).toHaveBeenCalledOnce()
      const parsed = JSON.parse(spy.mock.calls[0][0])
      expect(parsed.level).toBe('warn')
      expect(parsed.module).toBe('email')
      expect(parsed.message).toBe('Missing API key')
    })
  })

  describe('error', () => {
    it('emits structured JSON to console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      log.leave.error('Something failed')

      expect(spy).toHaveBeenCalledOnce()
      const parsed = JSON.parse(spy.mock.calls[0][0])
      expect(parsed.level).toBe('error')
      expect(parsed.module).toBe('leave')
      expect(parsed.message).toBe('Something failed')
      expect(parsed.error).toBeUndefined()
    })

    it('captures Error instance with message and stack', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('DB connection lost')
      log.audit.error('Query failed', err)

      const parsed = JSON.parse(spy.mock.calls[0][0])
      expect(parsed.error.message).toBe('DB connection lost')
      expect(parsed.error.stack).toBeDefined()
      expect(parsed.error.stack).toContain('DB connection lost')
    })

    it('captures non-Error objects as string', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      log.notification.error('Failed', 'some string error')

      const parsed = JSON.parse(spy.mock.calls[0][0])
      expect(parsed.error.message).toBe('some string error')
    })

    it('includes extra data alongside error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('timeout')
      log.reimbursement.error('Upload failed', err, { claimId: 'abc', size: 1024 })

      const parsed = JSON.parse(spy.mock.calls[0][0])
      expect(parsed.data).toEqual({ claimId: 'abc', size: 1024 })
      expect(parsed.error.message).toBe('timeout')
    })
  })

  describe('timestamp format', () => {
    it('produces ISO 8601 timestamps', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      log.request.info('test')

      const parsed = JSON.parse(spy.mock.calls[0][0])
      expect(() => new Date(parsed.timestamp)).not.toThrow()
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })
})
