import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Loader from './ui/Loader.jsx'

export default function RequireAdmin({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <Loader fullScreen />
  if (!session) return <Navigate to="/" replace />
  if (profile?.role !== 'admin') return <Navigate to="/app/today" replace />

  return children
}
