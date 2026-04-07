/* node:coverage disable */
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'
import { isWebMode, wsClient } from './api/provider'

const container = document.getElementById('root')

const mountApp = () => {
  if (!container) return
  createRoot(container).render(<App />)
}

if (isWebMode) {
  wsClient.connect()
    .catch((error) => {
      console.error('WebSocket bootstrap failed:', error)
    })
    .finally(() => {
      mountApp()
    })
} else {
  mountApp()
}
/* node:coverage enable */
