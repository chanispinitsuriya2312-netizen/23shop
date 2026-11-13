import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

const SiteChrome = lazy(() => import('./components/SiteChrome'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>
            <App />
            <Suspense fallback={null}>
              <SiteChrome />
            </Suspense>
          </CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
