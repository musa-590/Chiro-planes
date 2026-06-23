import { Component } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../lib/constants.js'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(err, info) {
    console.error('ErrorBoundary:', err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-ink">
          <h1 className="text-2xl font-bold text-white">Algo salio mal</h1>
          <p className="mt-2 text-muted-light">Intenta recargar la pagina.</p>
          <Link to="/" className="mt-4 text-accent font-semibold">
            Volver a {APP_NAME}
          </Link>
        </div>
      )
    }
    return this.props.children
  }
}
