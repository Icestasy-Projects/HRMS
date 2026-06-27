type AlertType = 'info' | 'success' | 'warning' | 'danger'

const styles: Record<AlertType, { wrapper: string; icon: string }> = {
  info:    { wrapper: 'bg-blue-50 border border-blue-200 text-blue-800',   icon: 'ℹ' },
  success: { wrapper: 'bg-green-50 border border-green-200 text-green-800', icon: '✓' },
  warning: { wrapper: 'bg-amber-50 border border-amber-200 text-amber-800', icon: '⚠' },
  danger:  { wrapper: 'bg-red-50 border border-red-200 text-red-800',       icon: '✕' },
}

export default function Alert({ type, message }: { type: AlertType; message: string }) {
  const s = styles[type]
  return (
    <div className={`${s.wrapper} rounded-lg px-4 py-3 flex gap-3 items-start`} role="alert">
      <span className="text-lg leading-none font-bold mt-0.5 shrink-0">{s.icon}</span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
