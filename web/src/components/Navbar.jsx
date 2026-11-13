import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useTheme } from '../lib/useTheme'

export default function Navbar({ search, onSearch }) {
  const { count, openDrawer } = useCart()
  const { count: wishCount } = useWishlist()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-cream/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-panel text-sm font-bold text-white">
            S<span className="text-brand">.</span>
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-ink-900 sm:block">ShopHub</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:text-ink-900">หน้าแรก</Link>
          <Link to="/?cat=ทั้งหมด#products" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:text-ink-900">สินค้า</Link>
          <Link to="/#sale" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:text-ink-900">โปรโมชัน</Link>
          <Link to="/track" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:text-ink-900">ติดตามพัสดุ</Link>
        </nav>

        <div className="flex flex-1 justify-end sm:justify-center">
          <label className="relative w-full max-w-md">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" strokeLinecap="round" />
            </svg>
            <input
              value={search ?? ''}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              onFocus={() => navigate('/')}
              placeholder="ค้นหาสินค้า..."
              className="w-full rounded-full border border-ink-100 bg-white py-2 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </label>
        </div>

        <Link
          to="/wishlist"
          className="relative hidden h-10 w-10 shrink-0 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100/70 sm:grid"
          aria-label="สินค้าที่ถูกใจ"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20.5C7 16.6 3 13.3 3 9.2A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9 3.2c0 4.1-4 7.4-9 11.3Z" strokeLinejoin="round" />
          </svg>
          {wishCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-panel px-1 text-[11px] font-bold text-white">
              {wishCount}
            </span>
          )}
        </Link>

        <button
          onClick={openDrawer}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100/70"
          aria-label="ตะกร้าสินค้า"
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 7h14l-1.4 8.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.7L6 7Z" strokeLinejoin="round" />
            <path d="M6 7 5 4H2.5" strokeLinecap="round" />
            <circle cx="9.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="16.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
          </svg>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white"
            >
              {count}
            </motion.span>
          )}
        </button>

        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100/70"
        >
          {theme === 'dark' ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <Link
          to="/account/login"
          className="hidden h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100/70 sm:grid"
          aria-label="บัญชีของฉัน"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </header>
  )
}
