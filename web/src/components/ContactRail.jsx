import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { subscribeSettings, defaultSettings } from '../lib/settings'
import { activeChannels, channelType } from '../lib/channels'
import ChannelIcon from './ChannelIcon'

const HIDDEN_PREFIXES = ['/admin']

export default function ContactRail() {
  const { pathname } = useLocation()
  const [settings, setSettings] = useState(defaultSettings)
  const [open, setOpen] = useState(false)

  useEffect(() => subscribeSettings(setSettings), [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const openDrawer = () => setOpen(true)
    window.addEventListener('shophub:contact', openDrawer)
    return () => window.removeEventListener('shophub:contact', openDrawer)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const channels = activeChannels(settings)
  if (channels.length === 0) return null

  return (
    <>
      {/* Desktop handle: peeks out of the right edge */}
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดช่องทางติดต่อร้าน"
        className="group fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-1.5 rounded-l-2xl bg-ink-900 py-3.5 pl-2.5 pr-2 text-white shadow-lift ring-1 ring-white/10 transition hover:bg-brand sm:flex"
      >
        <span className="absolute -left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-white/25 opacity-0 transition group-hover:opacity-100" />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.3-.6L3 21l1.8-5a8.1 8.1 0 0 1-.8-3.5 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 7.4z" />
        </svg>
        <span className="text-[11px] font-semibold tracking-wide [writing-mode:vertical-rl]">ติดต่อร้าน</span>
      </button>

      {/* Mobile FAB: sits above the bottom nav */}
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดช่องทางติดต่อร้าน"
        className="fixed right-4 bottom-24 z-40 grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-lift ring-1 ring-black/5 transition active:scale-95 sm:hidden"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand/30" />
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.3-.6L3 21l1.8-5a8.1 8.1 0 0 1-.8-3.5 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 7.4z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 flex h-full w-[min(21.5rem,92vw)] flex-col border-l border-ink-100 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Contact</p>
                  <h2 className="mt-1 text-lg font-extrabold tracking-tight text-ink-900">ติดต่อร้าน</h2>
                  <p className="mt-0.5 text-xs text-ink-400">{settings.storeName || 'ShopHub'} · เลือกช่องทางที่สะดวกได้เลย</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="ปิด"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500 shadow-soft transition hover:bg-ink-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-2">
                {channels.map((c, i) => {
                  const meta = channelType(c.type)
                  const external = c.href.startsWith('http')
                  return (
                    <a
                      key={`${c.type}-${i}`}
                      href={c.href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-card active:translate-y-0"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-black/[0.04]"
                        style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                      >
                        <ChannelIcon name={meta.icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink-800">{c.label || meta.label}</span>
                        <span className="block truncate text-xs text-ink-400">{c.value}</span>
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-ink-300">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </a>
                  )
                })}
              </div>

              <p className="pt-2 text-center text-[11px] text-ink-400">
                แตะช่องทางเพื่อติดต่อร้านโดยตรง · แก้ไขช่องทางได้ในหลังบ้าน
              </p>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
