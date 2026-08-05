import { useEffect, useMemo, useState } from 'react'
import { subscribeCampaign, isCampaignLive, countdownParts } from '../lib/campaign'
import { useToast } from '../context/ToastContext'

const DISMISS_KEY = 'shophub_campaign_dismissed'

/**
 * Modal popup announcing the active discount campaign with a live countdown
 * clock and copy-able promo code. Auto-shows once per campaign per browser
 * (dismissal remembered in localStorage), reappears if the campaign changes.
 */
export default function FlashSalePopup() {
  const [campaign, setCampaign] = useState(null)
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  useEffect(() => subscribeCampaign(setCampaign), [])

  // Decide whether to auto-open when a live campaign arrives.
  useEffect(() => {
    if (!campaign || !isCampaignLive(campaign)) return
    let dismissed = ''
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) || ''
    } catch {
      dismissed = ''
    }
    if (dismissed !== campaign.id) {
      const t = setTimeout(() => setOpen(true), 700)
      return () => clearTimeout(t)
    }
  }, [campaign])

  // Tick the countdown every second while open.
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [open])

  const parts = useMemo(
    () => countdownParts((campaign?.endsAt || 0) - now),
    [campaign, now]
  )

  if (!campaign || !isCampaignLive(campaign) || !open) return null

  function close() {
    setOpen(false)
    try {
      localStorage.setItem(DISMISS_KEY, campaign.id)
    } catch {
      /* ignore */
    }
  }

  function copyCode() {
    const code = campaign.promoCode || ''
    try {
      navigator.clipboard?.writeText(code)
    } catch {
      /* ignore */
    }
    setCopied(true)
    toast.success(`คัดลอกโค้ด ${code} แล้ว`)
    setTimeout(() => setCopied(false), 1800)
  }

  const accent = campaign.accent || '#4f46e5'

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 animate-[fadeIn_.2s_ease-out]"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-[popIn_.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={close}
          aria-label="ปิด"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-slate-500 hover:bg-white"
        >
          ✕
        </button>

        {/* Header banner */}
        <div
          className="px-6 pt-8 pb-6 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${accent}, #db2777)` }}
        >
          <div className="text-4xl">⚡</div>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight">{campaign.title}</h2>
          <p className="mt-1 text-sm text-white/90">{campaign.subtitle}</p>

          <div className="mt-3 inline-flex items-baseline gap-1 rounded-full bg-white/20 px-4 py-1.5">
            <span className="text-sm">ลดสูงสุด</span>
            <span className="text-2xl font-black">{campaign.discountPercent}%</span>
          </div>
        </div>

        {/* Countdown clock */}
        <div className="px-6 py-5">
          <p className="text-center text-xs font-medium text-slate-400">⏰ เหลือเวลาอีก</p>
          <div className="mt-2 flex justify-center gap-2">
            <TimeCell value={parts.days} label="วัน" />
            <Colon />
            <TimeCell value={parts.hours} label="ชม." />
            <Colon />
            <TimeCell value={parts.minutes} label="นาที" />
            <Colon />
            <TimeCell value={parts.seconds} label="วินาที" />
          </div>

          {/* Promo code */}
          {campaign.promoCode && (
            <button
              onClick={copyCode}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:border-brand"
            >
              <div className="text-left">
                <p className="text-[11px] text-slate-400">โค้ดส่วนลด (แตะเพื่อคัดลอก)</p>
                <p className="text-lg font-extrabold tracking-wider text-slate-800">
                  {campaign.promoCode}
                </p>
              </div>
              <span
                className="rounded-xl px-3 py-1.5 text-sm font-semibold text-white"
                style={{ background: accent }}
              >
                {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
              </span>
            </button>
          )}

          <button
            onClick={close}
            className="mt-4 w-full rounded-2xl py-3 text-center font-bold text-white transition hover:opacity-90"
            style={{ background: accent }}
          >
            {campaign.ctaText || 'ช้อปเลย'}
          </button>
          {campaign.minSpend > 0 && (
            <p className="mt-2 text-center text-[11px] text-slate-400">
              *เมื่อซื้อครบ {Number(campaign.minSpend).toLocaleString('th-TH')} บาท
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function TimeCell({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-xl font-extrabold text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-1 text-[10px] text-slate-400">{label}</span>
    </div>
  )
}

function Colon() {
  return <div className="grid h-12 place-items-center text-xl font-black text-slate-300">:</div>
}
