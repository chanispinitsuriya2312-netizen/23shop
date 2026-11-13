import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { subscribeSettings, defaultSettings } from '../lib/settings'

export default function LineFab() {
  const { pathname } = useLocation()
  const [lineId, setLineId] = useState(defaultSettings.lineId)

  useEffect(() => subscribeSettings((s) => setLineId(s.lineId || defaultSettings.lineId)), [])

  if (pathname.startsWith('/admin')) return null

  const href = `https://line.me/R/ti/p/${encodeURIComponent(String(lineId).replace(/^@/, '@'))}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 left-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#06c755] text-white shadow-lg transition hover:scale-105 hover:bg-[#05b34c]"
      aria-label="แชทกับร้านทาง LINE"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.9 3 3 6.4 3 10.7c0 3.4 2.3 6.2 5.6 7.5-.1.6-.4 1.9-.5 2.2-.1.4.2.4.4.3.3-.1 3.5-2.3 4.4-2.9.4.1.7.1 1.1.1 5.1 0 9-3.4 9-7.2S17.1 3 12 3zm-3 9.4H7.2V9.1h.8v2.6h1V9.1h.8v3.3zm2.6 0h-.8V9.1h.8v3.3zm3.5 0h-.7l-1.4-2v2h-.8V9.1h.7l1.4 2v-2h.8v3.3zm3.1-1.9h-1.1v.5h1.1v.5h-1.1v.5h1.1v.5h-1.9V9.1h1.9v.5h-1.1v.4h1.1v.5z" />
      </svg>
    </a>
  )
}
