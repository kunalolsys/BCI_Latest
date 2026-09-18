import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SessionTimeoutProvider } from './contexts/SessionTimeoutContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionTimeoutProvider>
      <App />
    </SessionTimeoutProvider>
  </StrictMode>,
)
