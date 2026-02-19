import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { msalConfig } from './authConfig'

const msalInstance = new PublicClientApplication(msalConfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    </MsalProvider>
  </StrictMode>,
)
