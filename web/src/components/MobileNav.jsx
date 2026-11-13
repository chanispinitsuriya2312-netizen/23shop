import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const HIDDEN_PREFIXES = ['/admin', '/product', '/checkout', '/cart', '/account']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { count, openDrawer } = useCart()
  const { count: wishCount } = useWishlist()

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const item = (active) =>
    `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium leading-none transition ${
      active ? 'text-brand' : 'text-ink-500'
    }`

  const icon = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(23,19,16,.45)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch">
        <Link to="/" className={item(pathname === '/')}>
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
          <svg {...icon}>
            <path d="M6 7h14l-1.4 8.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.7L6 7Z" strokeLinejoin="round" />
            <path d="M6 7 5 4H2.5" strokeLinecap="round" />
          </svg>
          ตะกร้า
          {count > 0 && (
            <span className="absolute right-[24%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white">
              {count}
            </span>
          )}
        </button>
        <Link to="/wishlist" className={item(pathname === '/wishlist')}>
          <svg {...icon} fill={pathname === '/wishlist' ? 'currentColor' : 'none'}>
            <path d="M12 20.5C7 16.6 3 13.3 3 9.2A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9 3.2c0 4.1-4 7.4-9 11.3Z" strokeLinejoin="round" />
          </svg>
          ถูกใจ
          {wishCount > 0 && (
            <span className="absolute right-[24%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink-900 px-1 text-[9px] font-bold leading-none text-white dark:text-[#171310]">
              {wishCount}
            </span>
          )}
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
