import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/accessibility.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Masquer l'avertissement "outdated JSX transform" en dev : il vient de react-big-calendar
// (bibliothèque compilée avec l'ancien transform). À retirer quand la lib sera mise à jour.
if (import.meta.env.DEV) {
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
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
