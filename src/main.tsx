import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/staatliches'
import '@fontsource/special-elite'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './styles.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
