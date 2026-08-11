import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import ThemeProvider from '@/lib/theme'
import { CurrencyProvider } from '@/lib/currency'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </ThemeProvider>
)