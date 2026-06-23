import { useState } from 'react'
import { whatsappRenew } from '../../lib/whatsapp.js'

export default function ExpirationAlert({ daysLeft }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const urgent = daysLeft <= 3
  const styles = urgent
    ? 'bg-red-100 text-red-900 border-red-200'
    : 'bg-accent text-ink border-accent-deep'

  return (
    <div className={`${styles} border-b px-4 py-2 flex items-center justify-between text-sm`}>
      <span>
        Tu plan vence en {daysLeft} dia{daysLeft === 1 ? '' : 's'}. Renuévalo.
      </span>
      <div className="flex items-center gap-2">
        <a
          href={whatsappRenew()}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline min-h-8"
        >
          Renovar
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="text-lg leading-none min-h-8 px-2"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  )
}
