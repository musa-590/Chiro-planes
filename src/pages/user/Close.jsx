import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth.js'
import { useUserPlan } from '../../hooks/useUserPlan.js'
import { useBodyMetrics } from '../../hooks/useBodyMetrics.js'
import { supabase } from '../../lib/supabase.js'
import { APP_NAME } from '../../lib/constants.js'
import { whatsappClose } from '../../lib/whatsapp.js'
import { Input, Textarea } from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import { SendIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon, PlusIcon, FlameIcon, CheckIcon } from '../../components/icons.jsx'

export default function Close() {
  const { session } = useAuth()
  const { plan } = useUserPlan(session?.user?.id)
  const { metrics } = useBodyMetrics(session?.user?.id)

  const last = metrics.at(-1)
  const [weight, setWeight] = useState(last?.weight_kg?.toString() || '')
  const [fat, setFat] = useState(last?.body_fat_pct?.toString() || '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [waUrl, setWaUrl] = useState(null)
  const [sentSentAt, setSentSentAt] = useState(plan?.last_whatsapp_sent_at)

  const weightDelta = last && weight ? Number(weight) - Number(last.weight_kg) : null
  const fatDelta = last && fat ? Number(fat) - Number(last.body_fat_pct) : null

  const adjust = (field, delta) => {
    const current = parseFloat(field === 'weight' ? weight : fat) || 0
    const next = Math.max(0, current + delta)
    if (field === 'weight') setWeight(next.toFixed(1))
    else setFat(next.toFixed(1))
  }

  const canSend = weight && fat && parseFloat(weight) > 0 && parseFloat(fat) >= 0

  const handleSend = async (e) => {
    e.preventDefault()
    if (!canSend) return
    setError(null)
    setSaving(true)
    try {
      const sentAt = new Date().toISOString()
      const { error: insErr } = await supabase.from('body_metrics').insert({
        user_id: session.user.id,
        recorded_at: sentAt,
        weight_kg: parseFloat(weight),
        body_fat_pct: parseFloat(fat),
        note: note || null,
        sent_to_whatsapp_at: sentAt,
      })
      if (insErr) throw insErr

      if (plan) {
        await supabase
          .from('user_plans')
          .update({ last_whatsapp_sent_at: sentAt })
          .eq('id', plan.id)
      }

      setSentSentAt(sentAt)
      setWaUrl(whatsappClose({ weight, fat, note }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Cerrar periodo | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-4">
        <div className="text-center pt-2">
          <div className="inline-flex w-14 h-14 rounded-full bg-accent/20 border-2 border-accent items-center justify-center mb-3">
            <SendIcon className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Cerrar mi periodo</h1>
          <p className="text-sm text-muted-light mt-1 max-w-xs mx-auto">
            Registra tu peso y grasa corporal, y envia tus resultados por WhatsApp.
          </p>
        </div>

        {sentSentAt ? (
          <Card className="bg-accent/10 border-accent">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-ink" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-accent font-bold">Ya enviaste resultados este periodo</p>
                <p className="text-xs text-muted-light mt-0.5">
                  {new Date(sentSentAt).toLocaleString('es-PE')}
                </p>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent text-sm font-bold underline mt-2 inline-block"
                  >
                    Abrir WhatsApp
                  </a>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        <Card>
          <h2 className="font-bold text-white mb-1">Medidas</h2>
          {last && (
            <p className="text-xs text-muted-light mb-4">
              Ultima medicion: <strong className="text-white">{last.weight_kg}kg</strong> · <strong className="text-white">{last.body_fat_pct}%</strong> grasa
              {' · '}{new Date(last.recorded_at).toLocaleDateString('es-PE')}
            </p>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <NumberStepper
              label="Peso"
              unit="kg"
              value={weight}
              onChange={setWeight}
              onAdjust={(d) => adjust('weight', d)}
              step={0.1}
              delta={weightDelta}
            />
            <NumberStepper
              label="Grasa corporal"
              unit="%"
              value={fat}
              onChange={setFat}
              onAdjust={(d) => adjust('fat', d)}
              step={0.1}
              max={80}
              delta={fatDelta}
            />
            <Textarea
              label="Cambios que notaste (opcional)"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Como te sentis, que cambios viste..."
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={!canSend || saving}>
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">Enviando...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <SendIcon className="w-4 h-4" />
                  Enviar resultados por WhatsApp
                </span>
              )}
            </Button>
          </form>

          {waUrl && !sentSentAt && (
            <div className="mt-4 p-3 bg-ink-700 border border-accent rounded-xl">
              <p className="text-sm text-accent mb-2">Se abrio WhatsApp. Si no se abrio:</p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-bold underline"
              >
                Abrir WhatsApp
              </a>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

function NumberStepper({ label, unit, value, onChange, onAdjust, step = 0.1, max, delta }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-muted-light">{label}</span>
        {delta !== null && !isNaN(delta) && (
          <span className={`text-xs font-bold flex items-center gap-1 ${delta < 0 ? 'text-accent' : delta > 0 ? 'text-amber-400' : 'text-muted-light'}`}>
            {delta < 0 ? <TrendingDownIcon className="w-3.5 h-3.5" /> : delta > 0 ? <TrendingUpIcon className="w-3.5 h-3.5" /> : null}
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}{unit} vs ultima
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdjust(-step)}
          className="shrink-0 w-12 h-12 rounded-xl bg-ink-700 border border-ink-700 text-white flex items-center justify-center active:scale-95 transition-transform"
          aria-label={`Restar ${step}${unit}`}
        >
          <MinusIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <input
            type="number"
            step={step}
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            max={max}
            className="w-full min-h-12 px-4 py-2 bg-ink-800 text-white border-2 border-ink-700 focus:border-accent rounded-xl text-center text-2xl font-extrabold focus:outline-none"
            placeholder="0.0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-light text-sm font-bold pointer-events-none">
            {unit}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAdjust(step)}
          className="shrink-0 w-12 h-12 rounded-xl bg-accent text-ink flex items-center justify-center active:scale-95 transition-transform"
          aria-label={`Sumar ${step}${unit}`}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
