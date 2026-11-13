import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { subscribeProducts, subscribeOrders } from '../lib/shop'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import Orders from './admin/Orders'
import Slips from './admin/Slips'
import Products from './admin/Products'
import Coupons from './admin/Coupons'
import Reviews from './admin/Reviews'
import Customers from './admin/Customers'
import Reports from './admin/Reports'
import Campaign from './admin/Campaign'
import Payment from './admin/Payment'
import Settings from './admin/Settings'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (!loading && !user) navigate('/admin/login')
  }, [loading, user, navigate])

  useEffect(() => {
    if (!user) return undefined
    const u1 = subscribeProducts(setProducts)
    const u2 = subscribeOrders(setOrders)
    return () => {
      u1 && u1()
      u2 && u2()
    }
  }, [user])

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-ink-400">กำลังโหลด...</div>
  }

  const badges = {
    orders: orders.filter((o) => o.status === 'Order Placed').length,
    slips: orders.filter((o) => o.paymentStatus === 'pending_review').length
  }

  return (
    <AdminLayout user={user} section={section} onSection={setSection} badges={badges}>
      {section === 'dashboard' && <Dashboard orders={orders} products={products} onGo={setSection} />}
      {section === 'orders' && <Orders orders={orders} />}
      {section === 'slips' && <Slips orders={orders} />}
      {section === 'products' && <Products products={products} />}
      {section === 'coupons' && <Coupons products={products} />}
      {section === 'reviews' && <Reviews products={products} />}
      {section === 'customers' && <Customers orders={orders} />}
      {section === 'reports' && <Reports orders={orders} products={products} />}
      {section === 'campaign' && <Campaign products={products} />}
      {section === 'payment' && <Payment />}
      {section === 'settings' && <Settings />}
    </AdminLayout>
  )
}
