import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Navbar({ search, onSearch }) {
  const { count } = useCart()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white font-bold">S</span>
          <span className="text-lg font-extrabold tracking-tight">ShopHub</span>
        </Link>

        <div className="flex-1">
          <input
            value={search ?? ''}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            onFocus={() => navigate('/')}
            placeholder="ค้นหาสินค้า..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brand focus:bg-white"
          />
        </div>

        <Link
          to="/cart"
          className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
          aria-label="ตะกร้า"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
            <path d="M6 6 5 3H2" strokeLinecap="round" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>

        <Link
          to="/account/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">เข้าสู่ระบบ</span>
        </Link>
      </div>
    </header>
  )
}
