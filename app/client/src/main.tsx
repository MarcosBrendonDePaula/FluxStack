import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // TODO: Re-enable StrictMode after fixing Live Components double mounting
  // <StrictMode>
    <App />
  // </StrictMode>,
)
