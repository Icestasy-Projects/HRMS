export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }
  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-gray-300 border-t-blue-700`}
      role="status"
      aria-label="Loading"
    />
  )
}
