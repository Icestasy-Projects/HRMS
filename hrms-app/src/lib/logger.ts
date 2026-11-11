type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  module: string
  timestamp: string
  data?: Record<string, unknown>
  error?: { message: string; stack?: string }
}

function emit(entry: LogEntry) {
  const output = JSON.stringify(entry)
  if (entry.level === 'error') {
    console.error(output)
  } else if (entry.level === 'warn') {
    console.warn(output)
  } else {
    console.log(output)
  }
}

function createModuleLogger(module: string) {
  return {
    info(message: string, data?: Record<string, unknown>) {
      emit({ level: 'info', message, module, timestamp: new Date().toISOString(), data })
    },
    warn(message: string, data?: Record<string, unknown>) {
      emit({ level: 'warn', message, module, timestamp: new Date().toISOString(), data })
    },
    error(message: string, err?: unknown, data?: Record<string, unknown>) {
      const errorInfo = err instanceof Error
        ? { message: err.message, stack: err.stack }
        : err ? { message: String(err) } : undefined
      emit({ level: 'error', message, module, timestamp: new Date().toISOString(), data, error: errorInfo })
    },
  }
}

export const log = {
  audit: createModuleLogger('audit'),
  auth: createModuleLogger('auth'),
  attendance: createModuleLogger('attendance'),
  leave: createModuleLogger('leave'),
  email: createModuleLogger('email'),
  holiday: createModuleLogger('holiday'),
  notification: createModuleLogger('notification'),
  reimbursement: createModuleLogger('reimbursement'),
  regularization: createModuleLogger('regularization'),
  separation: createModuleLogger('separation'),
  request: createModuleLogger('request'),
}
