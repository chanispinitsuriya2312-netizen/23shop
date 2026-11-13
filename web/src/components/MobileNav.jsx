import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { subscribeSettings } from '../lib/settings'

const HIDDEN_PREFIXES = ['/admin', '/product', '/checkout', '/cart', '/account']

export default function MobileNav() {
  const { pathname } = useLocation()
  const { count, openDrawer } = useCart()
  const { count: wishCount } = useWishlist()
  const [lineId, setLineId] = useState('@shophub')

  useEffect(
    () => subscribeSettings((s) => setLineId(s.lineId || '@shophub')),
    []
  )

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const item = (active) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
      active ? 'text-brand' : 'text-ink-500'
    }`

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch">
        <Link to="/" className={item(pathname === '/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
          </svg>
          หน้าแรก
        </Link>
        <Link to="/?cat=ทั้งหมด#products" className={item(false)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
          </svg>
          สินค้า
        </Link>
        <button onClick={openDrawer} className={`relative ${item(false)}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 7h14l-1.4 8.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.7L6 7Z" strokeLinejoin="round" />
            <path d="M6 7 5 4H2.5" strokeLinecap="round" />
          </svg>
          ตะกร้า
          {count > 0 && (
            <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
        <Link to="/wishlist" className={item(pathname === '/wishlist')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={pathname === '/wishlist' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20.5C7 16.6 3 13.3 3 9.2A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9 3.2c0 4.1-4 7.4-9 11.3Z" strokeLinejoin="round" />
          </svg>
          ถูกใจ
          {wishCount > 0 && (
            <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink-900 px-1 text-[9px] font-bold text-white dark:text-[#171310]">
              {wishCount}
            </span>
          )}
        </Link>
        <a
          href={`https://line.me/R/ti/p/${encodeURIComponent(lineId)}`}
          target="_blank"
          rel="noreferrer"
          className={item(false)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.9 3 3 6.3 3 10.3c0 2.4 1.4 4.5 3.6 5.9-.2.7-.7 2.4-.8 2.8 0 0 0 .3.2.4.2.1.4 0 .4 0 .4-.2 3-1.7 3.6-2.1.6.1 1.3.1 2 .1 5.1 0 9-3.3 9-7.2S17.1 3 12 3z" />
          </svg>
          แชท
        </a>
      </div>
    </nav>
  )
}
