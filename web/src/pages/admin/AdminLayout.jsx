import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../lib/useAuth'

export const ADMIN_SECTIONS = [
  { key: 'dashboard', label: 'ภาพรวม', icon: 'grid' },
  { key: 'orders', label: 'ออเดอร์', icon: 'receipt' },
  { key: 'slips', label: 'สลิปรอตรวจ', icon: 'card' },
  { key: 'products', label: 'สินค้า', icon: 'box' },
  { key: 'coupons', label: 'คูปอง', icon: 'tag' },
  { key: 'reviews', label: 'รีวิว', icon: 'star' },
  { key: 'customers', label: 'ลูกค้า', icon: 'users' },
  { key: 'reports', label: 'รายงาน', icon: 'chart' },
  { key: 'campaign', label: 'แคมเปญ', icon: 'megaphone' },
  { key: 'payment', label: 'PromptPay', icon: 'qr' },
  { key: 'settings', label: 'ตั้งค่าร้าน', icon: 'gear' }
]

const ICONS = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  card: 'M3 6h18v12H3zM3 10h18',
  box: 'M3 8l9-5 9 5v9l-9 4-9-4zM3 8l9 5 9-5M12 13v8',
  tag: 'M3 12V4h8l10 10-7 7zM8 8h.01',
  star: 'M12 3l2.7 5.8 6.3.7-4.7 4.2 1.3 6.3L12 16.9 6.4 20l1.3-6.3L3 9.5l6.3-.7z',
  users: 'M8 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 21c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4a3.5 3.5 0 010 7M18 15c2.3.8 4 3 4 6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  megaphone: 'M3 10v4l11 5V5zM14 8a4 4 0 010 8M6 14v4',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .4A7 7 0 0015 6l-.4-2h-3L11 6a7 7 0 00-3 2.4L6 8 5 11l2 1a7 7 0 000 0l-2 1 1 3 2-.4A7 7 0 009 18l.4 2h3l.4-2a7 7 0 003-2.4l2 .4 1-3-2-1z'
}

export function Icon({ name, className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name] || ICONS.grid} />
    </svg>
  )
}

export default function AdminLayout({ user, section, onSection, badges = {}, children }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const current = ADMIN_SECTIONS.find((s) => s.key === section)

  const nav = (
    <nav className="space-y-1">
      {ADMIN_SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => {
            onSection(s.key)
            setOpen(false)
          }}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            section === s.key
              ? 'bg-brand text-white'
              : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
          }`}
        >
          <Icon name={s.icon} />
          <span className="flex-1 text-left">{s.label}</span>
          {badges[s.key] > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${section === s.key ? 'bg-white/25 text-white' : 'bg-brand/10 text-brand'}`}>
              {badges[s.key]}
            </span>
          )}
        </button>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-ink-50/60">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur-lg lg:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200" aria-label="เมนู">
            <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="font-extrabold">แอดมิน · {current?.label}</span>
        </div>
        <button
          onClick={() => logout().then(() => navigate('/admin/login'))}
          className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600"
        >
          ออก
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-sm font-bold text-white">
                S<span className="text-brand">.</span>
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">หลังบ้าน ShopHub</p>
                <p className="truncate text-[11px] text-ink-400">{user.email}</p>
              </div>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-100 bg-white p-4 lg:flex">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-sm font-bold text-white">
              S<span className="text-brand">.</span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-tight">หลังบ้าน ShopHub</p>
              <p className="truncate text-[11px] text-ink-400">{user.email}</p>
            </div>
          </div>
          {nav}
          <div className="mt-auto space-y-2 border-t border-ink-100 pt-4">
            <button onClick={() => navigate('/')} className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-600 hover:border-brand hover:text-brand">
              ดูหน้าร้าน →
            </button>
            <button
              onClick={() => logout().then(() => navigate('/admin/login'))}
              className="w-full rounded-xl bg-ink-900 px-3 py-2 text-sm font-medium text-white hover:bg-ink-800"
            >
              ออกจากระบบ
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  )
}
