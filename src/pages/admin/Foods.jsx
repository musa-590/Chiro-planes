import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabase.js'
import { APP_NAME } from '../../lib/constants.js'
import { apiHealth } from '../../lib/api.js'
import Card from '../../components/ui/Card.jsx'
import Loader from '../../components/ui/Loader.jsx'
import { Input, Textarea } from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'

const CATEGORIES = ['', 'Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Bebida', 'Fruta', 'Proteina', 'Carbohidrato', 'Grasa', 'Otro']

export default function Foods() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiOk, setApiOk] = useState(null)
  const [formOpen, setFormOpen] = useState(true)
  const [form, setForm] = useState({ name: '', brand: '', category: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    apiHealth().then(setApiOk)
    const load = async () => {
      const { data, error } = await supabase.from('foods').select('*').order('name', { ascending: true })
      if (error) console.error('foods load error:', error)
      setFoods(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setMsg(null)
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        category: form.category || null,
        description: form.description.trim() || null,
      }
      const { data, error } = await supabase.from('foods').insert(payload).select().single()
      if (error) throw error
      setFoods((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ name: '', brand: '', category: '', description: '' })
      setMsg({ type: 'ok', text: 'Alimento agregado.' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar alimento?')) return
    const { error } = await supabase.from('foods').delete().eq('id', id)
    if (!error) setFoods((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <>
      <Helmet>
        <title>Alimentos | {APP_NAME}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white">Catalogo de alimentos</h2>
        <ApiStatus ok={apiOk} />
      </div>

      <Card>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          aria-expanded={formOpen}
          className="w-full flex items-center justify-between min-h-10 -m-1 p-1"
        >
          <h3 className="font-semibold text-white">Agregar alimento</h3>
          <svg
            className={`w-5 h-5 text-muted-light transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {formOpen && (
          <form onSubmit={submit} className="space-y-3 mt-3">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Pollo a la plancha"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marca (opcional)"
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="Ej: San Fernando"
            />
            <label className="block">
              <span className="block text-sm font-medium text-muted-light mb-1">Categoria</span>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full min-h-12 px-4 py-2 bg-ink-800 text-white border border-muted-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {CATEGORIES.map((c) => (
                  <option key={c || 'none'} value={c}>{c || 'Sin categoria'}</option>
                ))}
              </select>
            </label>
          </div>
          <Textarea
            label="Descripcion (opcional)"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Notas, ingredientes, preparacion..."
          />
          {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-accent' : 'text-red-400'}`}>{msg.text}</p>}
          <Button type="submit" disabled={saving || !form.name.trim()}>
            {saving ? 'Guardando...' : 'Agregar al catalogo'}
          </Button>
          </form>
        )}
      </Card>

      <h3 className="font-semibold mt-6 mb-2 text-white">En catalogo ({foods.length})</h3>
      {loading ? <Loader /> : foods.length === 0 ? (
        <Card><p className="text-sm text-muted-light text-center py-6">Vacio. Agrega alimentos con el formulario de arriba.</p></Card>
      ) : (
        <div className="space-y-2">
          {foods.map((f) => (
            <Card key={f.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-ink-700 flex items-center justify-center shrink-0 text-muted-light text-xs">
                {f.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{f.name}</p>
                <p className="text-xs text-muted-light truncate">
                  {[f.brand, f.category].filter(Boolean).join(' · ') || 'Sin detalle'}
                </p>
              </div>
              <button onClick={() => remove(f.id)} className="text-red-400 text-sm shrink-0 px-2">×</button>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

function ApiStatus({ ok }) {
  if (ok === null) return <span className="text-xs text-muted-light">...</span>
  if (ok === false) return <span className="text-xs text-red-400" title="Ejecuta: npm run dev:all">● API off</span>
  return <span className="text-xs text-accent">● API</span>
}
