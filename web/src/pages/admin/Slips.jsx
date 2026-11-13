import { useState } from 'react'
import { updateOrderAdmin } from '../../lib/ordersAdmin'
import { baht, formatDate } from '../../lib/format'

export default function Slips({ orders }) {
  const pending = orders.filter((o) => o.paymentStatus === 'pending_review')
  const [zoom, setZoom] = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')

  async function approve(o) {
    setBusy(o.id)
    try {
      await updateOrderAdmin(o.id, { paymentStatus: 'paid' })
    } finally {
      setBusy('')
    }
  }

  async function reject(o) {
    setBusy(o.id)
    try {
      await updateOrderAdmin(o.id, {
        paymentStatus: 'unpaid',
        paymentRejectReason: reason || 'สลิปไม่ถูกต้อง'
      })
      setRejectId(null)
      setReason('')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Payment review</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">สลิปรอตรวจ</h1>
        <p className="mt-1 text-sm text-ink-400">ลูกค้าแนบสลิปแล้ว {pending.length} รายการ</p>
      </div>

      {pending.length === 0 ? (
        <p className="py-16 text-center text-ink-400">ไม่มีสลิปรอตรวจ 🎉</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pending.map((o) => (
            <div key={o.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-ink-900">{o.orderCode}</p>
                  <p className="text-xs text-ink-400">{o.customerName} · {o.customerPhone}</p>
                  <p className="text-[11px] text-ink-400">{formatDate(o.createdAt)}</p>
                </div>
                <p className="text-lg font-extrabold text-brand">{baht(o.totalAmount)}</p>
              </div>

              {o.slipDataUrl ? (
                <img
                  src={o.slipDataUrl}
                  alt="สลิป"
                  onClick={() => setZoom(o.slipDataUrl)}
                  className="mt-3 h-44 w-full cursor-zoom-in rounded-xl bg-ink-50 object-contain ring-1 ring-ink-100"
                />
              ) : (
                <p className="mt-3 rounded-xl bg-ink-50 p-6 text-center text-xs text-ink-400">รอลูกค้าแนบสลิป</p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approve(o)}
                  disabled={busy === o.id || !o.slipDataUrl}
                  className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  ✓ ยืนยันรับเงิน
                </button>
                <button
                  onClick={() => setRejectId(o.id)}
                  disabled={busy === o.id}
                  className="flex-1 rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:border-red-300 hover:text-red-500"
                >
                  ปฏิเสธ
                </button>
              </div>

              {rejectId === o.id && (
                <div className="mt-2 flex gap-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เหตุผล (ลูกค้าใช้ชำระใหม่)" className="input flex-1" />
                  <button onClick={() => reject(o)} className="rounded-xl bg-red-500 px-3 text-xs font-semibold text-white">
                    ยืนยัน
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {zoom && (
        <div onClick={() => setZoom('')} className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <img src={zoom} alt="สลิป" className="max-h-[92vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
