import { log } from './logger'

export function reportError(error: Error & { digest?: string }, context?: Record<string, unknown>) {
  log.request.error('Unhandled error', error, {
    digest: error.digest,
    ...context,
  })

  // Sentry integration point:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.captureException(error, { extra: context })
}
