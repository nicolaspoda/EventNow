import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/accessibility.css'
import 'leaflet/dist/leaflet.css'
import './styles/map.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Filtrer les warnings/logs inutiles ou provenant de bibliothèques externes
if (import.meta.env.DEV) {
  // En développement : masquer uniquement les warnings connus et non critiques
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    // react-big-calendar : warning sur l'ancien JSX transform
    if (msg.includes('outdated JSX transform')) return
    originalWarn.apply(console, args)
  }
} else {
  // En production : filtrer les logs non critiques de bibliothèques externes
  const originalLog = console.log
  const originalWarn = console.warn
  
  console.log = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    // react-big-calendar : log "no layout data!" non critique
    if (msg.includes('no layout data')) return
    originalLog.apply(console, args)
  }
  
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    // Filtrer les warnings non critiques si nécessaire
    if (msg.includes('outdated JSX transform')) return
    originalWarn.apply(console, args)
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  console.error('Élément #root introuvable dans le DOM')
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (err) {
    console.error('Erreur au montage de l\'application:', err)
    rootEl.innerHTML = `<div style="padding:24px;font-family:sans-serif;background:#1a1a2e;color:#e2e8f0;min-height:100vh">
      <h1>Erreur au chargement</h1>
      <pre style="color:#f87171">${err instanceof Error ? err.message : String(err)}</pre>
      <p>Ouvre la console (F12) pour plus de détails.</p>
    </div>`
  }
}
