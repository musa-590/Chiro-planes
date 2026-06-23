const CONFIG = {
  complete: { label: 'Completo', className: 'bg-accent text-ink' },
  incomplete: { label: 'Incompleto', className: 'bg-amber-100 text-amber-900' },
  no_record: { label: 'Sin registro', className: 'bg-ink-700 text-muted-light border border-muted' },
}

export default function DayStatusChip({ status }) {
  const c = CONFIG[status] || CONFIG.no_record
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  )
}
