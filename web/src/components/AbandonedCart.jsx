import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { subscribeSettings, defaultSettings } from '../lib/settings'

const THIRTY_MIN = 30 * 60 * 1000

export default function AbandonedCart() {
  const { items, subtotal, count } = useCart()
  const [lineId, setLineId] = useState(defaultSettings.lineId)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => subscribeSettings((s) => setLineId(s.lineId || defaultSettings.lineId)), [])

  useEffect(() => {
    const since = Number(localStorage.getItem('shophub_cart_since')) || 0
    if (items.length > 0 && !dismissed && since && Date.now() - since > THIRTY_MIN) setShow(true)
    else setShow(false)
  }, [items, dismissed])

  if (!show) return null

  const text = `สนใจสินค้า ${count} ชิ้น (฿${subtotal.toLocaleString('th-TH')}) จาก ShopHub — ขอคำแนะนำหน่อยครับ/ค่ะ`

  return (
    <div className="fixed inset-x-4 bottom-20 z-40 mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-3 shadow-lift sm:bottom-5 sm:left-20 sm:right-auto">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-sm">🛒</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-800">ตะกร้าของคุณรออยู่</p>
          <p className="text-xs text-ink-400">มี {count} ชิ้นในตะกร้า — ปรึกษาร้านก่อนตัดสินใจได้</p>
          <div className="mt-2 flex gap-2">
            <a
              href={`https://line.me/R/msg/text/?${encodeURIComponent(text + `\nLINE: ${lineId}`)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#06c755] px-3 py-1.5 text-xs font-semibold text-white"
            >
              ส่งตะกร้าให้ร้านทาง LINE
            </a>
            <button onClick={() => setDismissed(true)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-500">
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
