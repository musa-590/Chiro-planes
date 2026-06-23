export default function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }) {
  const base = 'font-semibold rounded-xl disabled:opacity-50 transition-colors'
  const variants = {
    primary: 'bg-accent text-ink active:bg-accent-hover',
    secondary: 'bg-ink-800 text-white border border-muted active:bg-ink-700',
    ghost: 'text-muted-light',
    danger: 'bg-red-600 text-white',
  }
  const sizes = {
    sm: 'py-2 px-4 text-sm min-h-8',
    md: 'py-3 px-6 min-h-12',
    lg: 'py-4 px-8 text-lg min-h-14',
  }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
