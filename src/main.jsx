import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider } from 'react-router-dom'
import { router, futureConfig } from './router.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/index.css'

const initialTheme = localStorage.getItem('chiro-theme') || 'dark'
if (initialTheme === 'light') {
  document.documentElement.classList.add('light')
} else {
  document.documentElement.classList.add('dark')
}
document.documentElement.style.colorScheme = initialTheme

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <RouterProvider router={router} future={futureConfig} />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
)
