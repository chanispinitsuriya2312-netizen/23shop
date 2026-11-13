import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const HIDDEN_PREFIXES = ['/admin', '/product', '/checkout', '/cart', '/account']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { count, openDrawer } = useCart()
  const { count: wishCount } = useWishlist()

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const item = (active) =>
    `relative flex flex-1 flex-col items-center gap-1 rounded-[1.35rem] px-1 pb-1.5 pt-2 text-[10.5px] font-semibold leading-none transition-colors ${
      active ? 'text-brand' : 'text-ink-500 hover:text-ink-700'
    }`

  const pill = (active) =>
    active ? (
      <motion.span
        layoutId="mobile-nav-pill"
        className="absolute inset-0 -z-10 rounded-[1.35rem] bg-brand/10 ring-1 ring-brand/15"
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      />
    ) : null

  const icon = { width: 21, height: 21, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9 }

  const badge = (value, tone) =>
    value > 0 && (
      <span
        className={`absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold leading-none ${
          tone === 'brand' ? 'bg-brand text-white' : 'bg-panel text-white'
        }`}
      >
        {value}
      </span>
    )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-sm items-stretch gap-0.5 rounded-[1.7rem] border border-ink-100 bg-white/90 p-1.5 shadow-lift backdrop-blur-xl">
        <Link to="/" className={item(pathname === '/')}>
          {pill(pathname === '/')}
          <svg {...icon}>
            <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
          </svg>
          หน้าแรก
        </Link>
        <Link to="/?cat=ทั้งหมด#products" className={item(false)}>
          <svg {...icon}>
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
          </svg>
          สินค้า
        </Link>
        <button onClick={openDrawer} className={item(false)}>
          <span className="relative">
            <svg {...icon}>
              <path d="M6 7h14l-1.4 8.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.7L6 7Z" strokeLinejoin="round" />
              <path d="M6 7 5 4H2.5" strokeLinecap="round" />
            </svg>
            {badge(count, 'brand')}
          </span>
          ตะกร้า
        </button>
        <Link to="/wishlist" className={item(pathname === '/wishlist')}>
          {pill(pathname === '/wishlist')}
          <span className="relative">
            <svg {...icon} fill={pathname === '/wishlist' ? 'currentColor' : 'none'}>
              <path d="M12 20.5C7 16.6 3 13.3 3 9.2A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9 3.2c0 4.1-4 7.4-9 11.3Z" strokeLinejoin="round" />
            </svg>
            {badge(wishCount, 'panel')}
          </span>
          ถูกใจ
        </Link>
        <button onClick={() => window.dispatchEvent(new Event('shophub:contact'))} className={item(false)}>
          <svg {...icon}>
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.3-.6L3 21l1.8-5a8.1 8.1 0 0 1-.8-3.5 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 7.4z" strokeLinejoin="round" />
          </svg>
          แชท
        </button>
      </div>
    </nav>
  )
}
