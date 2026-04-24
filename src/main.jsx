import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Signal splash screen to fade out after React mounts
// requestAnimationFrame ensures at least one frame has painted
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('app-ready'))
  })
})
