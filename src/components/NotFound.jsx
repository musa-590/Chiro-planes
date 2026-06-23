import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/constants.js'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-ink">
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="mt-2 text-muted-light">Pagina no encontrada</p>
      <Link to="/" className="mt-4 text-accent font-semibold">
        Volver a {APP_NAME}
      </Link>
    </div>
  )
}
