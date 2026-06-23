export function Input({ label, error, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-muted-light mb-1">{label}</span>}
      <input
        className={`w-full min-h-12 px-4 py-2 bg-ink-800 text-white border rounded-xl text-base placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${
          error ? 'border-red-500' : 'border-muted-dark'
        } ${className}`}
        {...rest}
      />
      {error && <span className="block text-xs text-red-400 mt-1">{error}</span>}
    </label>
  )
}

export function Textarea({ label, error, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-muted-light mb-1">{label}</span>}
      <textarea
        className={`w-full px-4 py-2 bg-ink-800 text-white border rounded-xl text-base placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${
          error ? 'border-red-500' : 'border-muted-dark'
        } ${className}`}
        {...rest}
      />
      {error && <span className="block text-xs text-red-400 mt-1">{error}</span>}
    </label>
  )
}
