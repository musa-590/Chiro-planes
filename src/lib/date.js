export const todayISO = () => new Date().toISOString().slice(0, 10)

export const todayLongDate = () => {
  const now = new Date()
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`
}

export const todayShortDate = () => {
  const now = new Date()
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${dias[now.getDay()]} ${now.getDate()} ${meses[now.getMonth()]} ${now.getFullYear()}`
}

export const daysUntil = (iso) => {
  if (!iso) return null
  const target = new Date(iso).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / 86_400_000)
}

export const isExpired = (iso) => {
  const d = daysUntil(iso)
  return d !== null && d < 0
}

export const isExpiringSoon = (iso, withinDays = 5) => {
  const d = daysUntil(iso)
  return d !== null && d >= 0 && d <= withinDays
}

export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
