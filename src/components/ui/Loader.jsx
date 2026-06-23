export default function Loader({ fullScreen = false }) {
  const content = (
    <div className="flex items-center justify-center gap-2 text-muted-light">
      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm">Cargando...</span>
    </div>
  )

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-ink">{content}</div>
  }
  return <div className="py-8">{content}</div>
}
