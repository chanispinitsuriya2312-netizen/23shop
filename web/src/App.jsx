import { Routes, Route, Navigate } from 'react-router-dom'
import Storefront from './pages/Storefront'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import AccountLogin from './pages/AccountLogin'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Routes>
      {/* โซนลูกค้า (Storefront) */}
      <Route path="/" element={<Storefront />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />

      {/* โซนสมาชิกลูกค้า /account/* (จองพื้นที่ไว้ — อนาคต) */}
      <Route path="/account/login" element={<AccountLogin />} />
      <Route path="/account" element={<Navigate to="/account/login" replace />} />

      {/* โซนผู้ดูแลระบบ /admin/* (แยกจากลูกค้า) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
