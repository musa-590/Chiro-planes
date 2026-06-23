export default function Button({ children, variant = 'primary', className = '', ...rest }) {
  const base = 'w-full font-semibold py-3 px-6 rounded-xl min-h-12 disabled:opacity-50 transition-colors'
  const variants = {
    primary: 'bg-accent text-ink active:bg-accent-hover',
    secondary: 'bg-ink-800 text-white border border-muted active:bg-ink-700',
    ghost: 'text-muted-light',
    danger: 'bg-red-600 text-white',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
