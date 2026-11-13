import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

const Storefront = lazy(() => import('./pages/Storefront'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Info = lazy(() => import('./pages/Info'))
const Track = lazy(() => import('./pages/Track'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const AccountLogin = lazy(() => import('./pages/AccountLogin'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function ScrollToTop() {
  const { pathname, hash, search } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash, search])
  return null
}

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* โซนลูกค้า (Storefront) */}
          <Route path="/" element={<Storefront />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track" element={<Track />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<Info />} />
          <Route path="/contact" element={<Info />} />
          <Route path="/policy" element={<Info />} />
          <Route path="/policy/:slug" element={<Info />} />

          {/* โซนสมาชิกลูกค้า /account/* (จองพื้นที่ไว้ — อนาคต) */}
          <Route path="/account/login" element={<AccountLogin />} />
          <Route path="/account" element={<Navigate to="/account/login" replace />} />

          {/* โซนผู้ดูแลระบบ /admin/* (แยกจากลูกค้า) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
