import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { APP_NAME, APP_DESCRIPTION } from '../lib/constants.js'
import { whatsappAcquire } from '../lib/whatsapp.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

const CheckIcon = ({ className = '' }) => (
  <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M21.35 11.1H12v3.8h5.35c-.5 2.55-2.7 4.4-5.35 4.4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.5 0 2.85.55 3.9 1.45l2.65-2.65C16.85 4.4 14.55 3.5 12 3.5 7.3 3.5 3.5 7.3 3.5 12s3.8 8.5 8.5 8.5c4.9 0 8.15-3.45 8.15-8.3 0-.55-.05-1.05-.15-1.6z" />
  </svg>
)

const WhatsappIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.2.8.9-3.1-.2-.3C4 14.7 3.5 13.4 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5z" />
  </svg>
)

function HeroIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-44 h-44 sm:w-52 sm:h-52 mx-auto" aria-hidden="true">
      <defs>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8F063" />
          <stop offset="100%" stopColor="#C9C24A" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="158" rx="55" ry="8" fill="#F8F063" opacity="0.15" />
      <path d="M58 132 L142 132 L130 168 L70 168 Z" fill="#F8F063" opacity="0.25" />
      <rect x="92" y="55" width="16" height="78" rx="8" fill="url(#leafGrad)" />
      <path d="M100 78 Q60 70 48 42 Q82 50 100 88 Z" fill="url(#leafGrad)" />
      <path d="M100 78 Q140 70 152 42 Q118 50 100 88 Z" fill="url(#leafGrad)" />
      <path d="M100 55 Q76 32 66 12 Q92 26 100 60 Z" fill="#F8F063" opacity="0.6" />
      <circle cx="100" cy="100" r="6" fill="#000" />
    </svg>
  )
}

export default function Landing() {
  const { session, profile, loading, profileReady, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && session && profileReady) {
      const dest = profile?.role === 'admin' ? '/admin' : '/app/today'
      navigate(dest, { replace: true })
    }
  }, [session, profile, loading, profileReady, navigate])

  return (
    <>
      <Helmet>
        <title>{APP_NAME} — {APP_DESCRIPTION}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: APP_NAME,
            description: APP_DESCRIPTION,
            areaServed: 'PE',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'sales',
              telephone: '+51-905-679-279',
              availableLanguage: 'Spanish',
            },
          })}
        </script>
      </Helmet>

      <main className="min-h-screen flex flex-col bg-ink animate-fadeIn">
        <header className="px-4 py-4 safe-area-pt flex items-center justify-between max-w-md mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-ink font-bold text-sm">CS</span>
            </div>
            <h1 className="text-lg font-bold text-accent">{APP_NAME}</h1>
          </div>
          <ThemeToggle />
        </header>

        <section className="flex-1 flex flex-col px-5 py-6 max-w-md mx-auto w-full">
          <div className="text-center mb-6">
            <p className="text-accent text-xs font-bold tracking-widest uppercase mb-3">
              Plan nutricional
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] text-white tracking-tight">
              Tu plan,{' '}
              <span className="text-accent">semana</span>{' '}
              a{' '}
              <span className="text-accent">semana</span>
            </h2>
            <p className="mt-4 text-muted-light text-base leading-relaxed">
              Personalizado para ti, con seguimiento directo por WhatsApp y resultados que puedes ver.
            </p>
          </div>

          <div className="mb-6">
            <HeroIllustration />
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {session ? (
              <>
                <button
                  onClick={() => navigate(profile?.role === 'admin' ? '/admin' : '/app/today')}
                  className="w-full bg-accent text-ink font-bold py-4 px-6 rounded-2xl min-h-14 text-base shadow-lg shadow-accent/20 active:scale-[0.98] transition-transform"
                >
                  Ir a {profile?.role === 'admin' ? 'panel' : 'mi plan'}
                </button>
                <button onClick={signOut} className="w-full text-muted text-sm py-2">
                  Cerrar sesion
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full bg-accent text-ink font-bold py-4 px-6 rounded-2xl min-h-14 text-base flex items-center justify-center gap-3 shadow-lg shadow-accent/20 active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  <GoogleIcon />
                  Continuar con Google
                </button>
                <a
                  href={whatsappAcquire()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-transparent text-accent border-2 border-accent font-bold py-3.5 px-6 rounded-2xl min-h-14 text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <WhatsappIcon />
                  Quiero adquirir un plan
                </a>
              </>
            )}
          </div>

          <div className="border-t border-ink-700 pt-5 space-y-3">
            <Feature
              title="Plan a tu medida"
              subtitle="Comidas y horarios pensados para tu cuerpo y rutina"
            />
            <Feature
              title="Seguimiento por WhatsApp"
              subtitle="Acompañamiento directo, sin formularios ni espera"
            />
            <Feature
              title="Resultados medibles"
              subtitle="Marca tu progreso, registra medidas, ve los cambios"
            />
          </div>
        </section>

        <footer className="px-4 py-6 text-center text-xs text-muted safe-area-pb">
          <p>© {new Date().getFullYear()} {APP_NAME} · Hecho con cuidado</p>
        </footer>
      </main>
    </>
  )
}

function Feature({ title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center mt-0.5">
        <CheckIcon className="text-ink w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-muted-light text-xs leading-relaxed">{subtitle}</p>
      </div>
    </div>
  )
}
