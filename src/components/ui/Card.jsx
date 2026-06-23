export default function Card({ children, className = '', ...rest }) {
  return (
    <div className={`bg-ink-800 border border-ink-700 rounded-2xl p-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}
