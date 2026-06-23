import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import UserLayout from './components/layout/UserLayout.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import Loader from './components/ui/Loader.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'

const Landing = lazy(() => import('./pages/Landing.jsx'))
const Callback = lazy(() => import('./pages/auth/Callback.jsx'))
const NotFound = lazy(() => import('./components/NotFound.jsx'))

const Today = lazy(() => import('./pages/user/Today.jsx'))
const History = lazy(() => import('./pages/user/History.jsx'))
const Close = lazy(() => import('./pages/user/Close.jsx'))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'))
const AdminUserDetail = lazy(() => import('./pages/admin/UserDetail.jsx'))
const AdminFoods = lazy(() => import('./pages/admin/Foods.jsx'))
const AdminPlans = lazy(() => import('./pages/admin/Plans.jsx'))

const wrap = (el) => <Suspense fallback={<Loader fullScreen />}>{el}</Suspense>

const futureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_fetcherPersist: true,
  v7_skipActionErrorRevalidation: true,
}

export const router = createBrowserRouter([
  { path: '/', element: wrap(<Landing />) },
  { path: '/auth/callback', element: wrap(<Callback />) },
  {
    path: '/app',
    element: <RequireAuth><UserLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/app/today" replace /> },
      { path: 'today', element: wrap(<Today />) },
      { path: 'history', element: wrap(<History />) },
      { path: 'close', element: wrap(<Close />) },
    ],
  },
  {
    path: '/admin',
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    children: [
      { index: true, element: wrap(<AdminDashboard />) },
      { path: 'users', element: wrap(<AdminUsers />) },
      { path: 'users/:id', element: wrap(<AdminUserDetail />) },
      { path: 'foods', element: wrap(<AdminFoods />) },
      { path: 'plans', element: wrap(<AdminPlans />) },
    ],
  },
  { path: '*', element: wrap(<NotFound />) },
], {
  future: futureConfig,
})

export { futureConfig }
