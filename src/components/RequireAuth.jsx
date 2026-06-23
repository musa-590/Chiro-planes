import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Loader from './ui/Loader.jsx'

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader fullScreen />
  if (!session) return <Navigate to="/" state={{ from: location }} replace />

  return children
}
