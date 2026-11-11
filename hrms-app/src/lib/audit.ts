import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/logger'

export async function logAudit({
  actorId,
  action,
  tableName,
  recordId,
  oldValue,
  newValue,
}: {
  actorId: string
  action: string
  tableName: string
  recordId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
}) {
  const admin = createAdminClient()
  const { error } = await admin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    table_name: tableName,
    record_id: recordId ?? null,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  })
  if (error) log.audit.error('Audit log insert failed', error, { actorId, action, tableName, recordId })
}
