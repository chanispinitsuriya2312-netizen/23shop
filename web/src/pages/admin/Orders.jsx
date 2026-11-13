import { useMemo, useState } from 'react'
import { updateOrderAdmin, paymentLabel } from '../../lib/ordersAdmin'
import { ORDER_STATUSES, nextStatus } from '../../lib/shop'
import { baht, formatDate, statusInfo } from '../../lib/format'
import { downloadCsv, ordersToRows, ORDER_CSV_HEADERS, startOfDay } from '../../lib/adminStats'

const COURIERS = ['Kerry Express', 'Flash Express', 'J&T Express', 'ไปรษณีย์ไทย (EMS)', 'SPX Express', 'Ninja Van', 'อื่น ๆ']

export default function Orders({ orders }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [pay, setPay] = useState('all')
  const [range, setRange] = useState('all')
  const [selected, setSelected] = useState([])
  const [detailId, setDetailId] = useState(null)
  const [busy, setBusy] = useState(false)

  const detail = orders.find((o) => o.id === detailId) || null

  const filtered = useMemo(() => {
    const from = (() => {
      if (range === 'today') return startOfDay()
      if (range === '7') return Date.now() - 7 * 86400000
      if (range === '30') return Date.now() - 30 * 86400000
      return 0
    })()
    const needle = q.trim().toLowerCase()
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false
      if (pay !== 'all' && o.paymentStatus !== pay) return false
      if (Number(o.createdAt) < from) return false
      if (!needle) return true
      return [o.orderCode, o.customerName, o.customerPhone].some((f) =>
        String(f || '').toLowerCase().includes(needle)
      )
    })
  }, [orders, q, status, pay, range])

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function bulkAdvance() {
    if (!selected.length) return
    setBusy(true)
    try {
      for (const id of selected) {
        const o = orders.find((x) => x.id === id)
        if (!o || o.status === 'Delivered') continue
        await updateOrderAdmin(id, { status: nextStatus(o.status) })
      }
      setSelected([])
    } finally {
      setBusy(false)
    }
  }

  async function bulkStatus(next) {
    setBusy(true)
    try {
      for (const id of selected) await updateOrderAdmin(id, { status: next })
      setSelected([])
    } finally {
      setBusy(false)
    }
  }

  const selOrders = orders.filter((o) => selected.includes(o.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Orders</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">ออเดอร์</h1>
        </div>
        <button
          onClick={() => downloadCsv(`orders-${Date.now()}.csv`, ORDER_CSV_HEADERS, ordersToRows(filtered))}
          className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-600 hover:border-brand hover:text-brand"
        >
          Export CSV
        </button>
      </div>

      <div className="card-surface flex flex-wrap items-center gap-2 p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา order code / ชื่อ / เบอร์โทร"
          className="input min-w-[200px] flex-1"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-ink-200 px-2.5 py-2 text-sm">
          <option value="all">ทุกสถานะ</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{statusInfo(s).label}</option>
          ))}
        </select>
        <select value={pay} onChange={(e) => setPay(e.target.value)} className="rounded-xl border border-ink-200 px-2.5 py-2 text-sm">
          <option value="all">ทุกการชำระ</option>
          <option value="cod">เก็บปลายทาง</option>
          <option value="unpaid">ยังไม่ชำระ</option>
          <option value="pending_review">รอตรวจสลิป</option>
          <option value="paid">ชำระแล้ว</option>
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-xl border border-ink-200 px-2.5 py-2 text-sm">
          <option value="all">ทุกช่วงเวลา</option>
          <option value="today">วันนี้</option>
          <option value="7">7 วัน</option>
          <option value="30">30 วัน</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-brand/30 bg-white p-3 shadow-card">
          <span className="text-sm font-semibold text-ink-700">เลือก {selected.length} รายการ</span>
          <button onClick={bulkAdvance} disabled={busy} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            เลื่อนสถานะถัดไป
          </button>
          <select
            onChange={(e) => e.target.value && bulkStatus(e.target.value)}
            disabled={busy}
            defaultValue=""
            className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs"
          >
            <option value="" disabled>ตั้งสถานะเป็น…</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{statusInfo(s).label}</option>
            ))}
          </select>
          <button
            onClick={() => downloadCsv(`orders-selected-${Date.now()}.csv`, ORDER_CSV_HEADERS, ordersToRows(selOrders))}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600"
          >
            Export ที่เลือก
          </button>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-ink-400 hover:text-ink-700">ล้าง</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-400">ไม่พบออเดอร์ตามเงื่อนไข</p>
      ) : (
        <div className="card-surface divide-y divide-ink-100">
          {filtered.map((o) => {
            const payInfo = paymentLabel(o.paymentStatus)
            const checked = selected.includes(o.id)
            return (
              <div key={o.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${checked ? 'bg-brand/[0.03]' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(o.id)} className="h-4 w-4 shrink-0" />
                <button onClick={() => setDetailId(o.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-ink-900">{o.orderCode}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo(o.status).color}`}>
                      {statusInfo(o.status).label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${payInfo.color}`}>
                      {payInfo.label}
                    </span>
                    {o.paymentStatus === 'pending_review' && o.slipDataUrl && (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">มีสลิป</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-500">
                    {o.customerName} · {o.customerPhone} · {formatDate(o.createdAt)}
                  </p>
                  <p className="truncate text-[11px] text-ink-400">{o.shippingAddress}</p>
                </button>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-brand">{baht(o.totalAmount)}</p>
                  <p className="text-[11px] text-ink-400">{(o.items || []).length} รายการ</p>
                </div>
                <div className="flex gap-1.5">
                  {o.status !== 'Delivered' && (
                    <button
                      onClick={async () => {
                        setBusy(true)
                        try {
                          await updateOrderAdmin(o.id, { status: nextStatus(o.status) })
                        } finally {
                          setBusy(false)
                        }
                      }}
                      disabled={busy}
                      className="rounded-lg bg-panel px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand disabled:opacity-50"
                    >
                      →
                    </button>
                  )}
                  <button onClick={() => setDetailId(o.id)} className="rounded-lg bg-ink-100 px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-200">
                    เปิด
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detail && <OrderDrawer order={detail} onClose={() => setDetailId(null)} />}
    </div>
  )
}

function OrderDrawer({ order, onClose }) {
  const [courier, setCourier] = useState(order.courier || '')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [adminNote, setAdminNote] = useState(order.adminNote || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState(order.paymentRejectReason || '')

  const history = order.statusHistory?.length
    ? order.statusHistory
    : [{ status: order.status, at: order.createdAt }]

  async function save() {
    setSaving(true)
    try {
      await updateOrderAdmin(order.id, { courier, trackingNumber, adminNote })
      setSaved(true)
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  async function pay(status, extra = {}) {
    try {
      await updateOrderAdmin(order.id, { paymentStatus: status, ...extra })
      onClose()
    } catch (e) {
      alert('อัปเดตไม่สำเร็จ: ' + (e?.message || e))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-extrabold">{order.orderCode}</p>
            <p className="text-xs text-ink-400">{formatDate(order.createdAt)} · {order.paymentMethod}</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-ink-400 hover:bg-ink-100" aria-label="ปิด">✕</button>
        </div>

        <div className="mt-4 rounded-2xl bg-ink-50 p-3 text-sm">
          <p className="font-semibold text-ink-800">{order.customerName} · {order.customerPhone}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">{order.shippingAddress}</p>
        </div>

        <div className="mt-4 space-y-1.5">
          {(order.items || []).map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <img src={it.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <span className="line-clamp-1 flex-1 text-ink-700">{it.title} × {it.quantity}</span>
              <span className="font-medium text-ink-800">{baht((Number(it.price) || 0) * (Number(it.quantity) || 0))}</span>
            </div>
          ))}
        </div>

        <dl className="mt-3 space-y-1 border-t border-ink-100 pt-3 text-sm text-ink-500">
          <Row label="ยอดสินค้า" value={baht(order.subtotal)} />
          {Number(order.discountAmount) > 0 && <Row label={`ส่วนลด ${order.promoCode || ''}`} value={`-${baht(order.discountAmount)}`} />}
          <Row label="ค่าจัดส่ง" value={baht(order.shippingFee)} />
          <Row label="รวมทั้งสิ้น" value={baht(order.totalAmount)} strong />
        </dl>

        {/* Slip review */}
        {(order.slipDataUrl || order.paymentStatus === 'pending_review') && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">หลักฐานการชำระเงิน</p>
            {order.slipDataUrl ? (
              <img src={order.slipDataUrl} alt="สลิป" className="mt-2 max-h-56 rounded-xl object-contain ring-1 ring-amber-200" />
            ) : (
              <p className="mt-2 text-xs text-amber-700">ลูกค้ายังไม่แนบสลิป</p>
            )}
            {order.paymentStatus !== 'paid' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => pay('paid')} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">
                  ✓ ยืนยันรับเงิน
                </button>
                {!rejecting ? (
                  <button onClick={() => setRejecting(true)} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700">
                    ปฏิเสธสลิป
                  </button>
                ) : (
                  <div className="flex w-full gap-2">
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="เหตุผล เช่น ยอดไม่ตรง"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => pay('unpaid', { paymentRejectReason: rejectReason })}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      ยืนยันปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            )}
            {order.paymentRejectReason && (
              <p className="mt-2 text-xs text-red-600">เหตุผลที่ปฏิเสธ: {order.paymentRejectReason}</p>
            )}
          </div>
        )}

        {/* Status timeline */}
        <div className="mt-5">
          <p className="text-sm font-bold text-ink-900">ไทม์ไลน์สถานะ</p>
          <ol className="mt-2">
            {history.map((h, i) => (
              <li key={i} className="flex gap-2.5">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${i === history.length - 1 ? 'bg-brand' : 'bg-ink-300'}`} />
                  {i < history.length - 1 && <span className="h-6 w-px bg-ink-200" />}
                </div>
                <p className="pb-1 text-xs text-ink-500">
                  <span className="font-semibold text-ink-800">{statusInfo(h.status).label}</span>
                  {' · '}
                  {formatDate(h.at)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Courier + tracking */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">ขนส่ง</span>
            <select value={courier} onChange={(e) => { setCourier(e.target.value); setSaved(false) }} className="input">
              <option value="">เลือกขนส่ง</option>
              {COURIERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">เลขพัสดุ</span>
            <input value={trackingNumber} onChange={(e) => { setTrackingNumber(e.target.value); setSaved(false) }} className="input" placeholder="เช่น TH123456789" />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-ink-500">โน้ตแอดมิน (ลูกค้าไม่เห็น)</span>
          <textarea value={adminNote} onChange={(e) => { setAdminNote(e.target.value); setSaved(false) }} rows={2} className="input" />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={save} disabled={saving} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลจัดส่ง'}
          </button>
          <button onClick={() => printInvoice(order)} className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:border-brand hover:text-brand">
            พิมพ์ใบเสร็จ
          </button>
          {saved && <span className="text-xs font-medium text-green-600">บันทึกแล้ว ✓</span>}
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className={strong ? 'text-base font-extrabold text-brand' : 'font-medium text-ink-700'}>{value}</dd>
    </div>
  )
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

export function printInvoice(order) {
  const rows = (order.items || [])
    .map((it) => `<tr><td>${esc(it.title)}</td><td class="r">${it.quantity}</td><td class="r">${baht(it.price)}</td><td class="r">${baht((Number(it.price) || 0) * (Number(it.quantity) || 0))}</td></tr>`)
    .join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(order.orderCode)}</title>
  <style>
    body{font-family:'Anuphan',sans-serif;padding:32px;color:#171310;max-width:700px;margin:auto}
    h1{font-size:22px;margin:0}
    .muted{color:#6f6861;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
    th,td{border-bottom:1px solid #eceae6;padding:8px 6px;text-align:left}
    .r{text-align:right}
    .totals{margin-top:16px;font-size:13px;width:100%;max-width:280px;margin-left:auto}
    .totals div{display:flex;justify-content:space-between;padding:4px 0}
    .grand{font-weight:800;font-size:15px;color:#ff5722;border-top:1px solid #eceae6;margin-top:6px;padding-top:8px}
  </style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div><h1>ShopHub</h1><p class="muted">ใบเสร็จรับเงิน / ใบส่งของ</p></div>
    <div style="text-align:right"><p style="font-weight:700">${esc(order.orderCode)}</p><p class="muted">${esc(formatDate(order.createdAt))}</p></div>
  </div>
  <hr style="border:none;border-top:1px solid #eceae6;margin:16px 0">
  <p style="font-size:13px;margin:0"><strong>${esc(order.customerName)}</strong> · ${esc(order.customerPhone)}</p>
  <p class="muted" style="margin:4px 0 0">${esc(order.shippingAddress)}</p>
  <table><thead><tr><th>สินค้า</th><th class="r">จำนวน</th><th class="r">ราคา</th><th class="r">รวม</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div><span>ยอดสินค้า</span><span>${baht(order.subtotal)}</span></div>
    ${Number(order.discountAmount) > 0 ? `<div><span>ส่วนลด</span><span>-${baht(order.discountAmount)}</span></div>` : ''}
    <div><span>ค่าจัดส่ง</span><span>${baht(order.shippingFee)}</span></div>
    <div class="grand"><span>รวมทั้งสิ้น</span><span>${baht(order.totalAmount)}</span></div>
  </div>
  <p class="muted" style="margin-top:24px">ชำระโดย: ${esc(order.paymentMethod)} · สถานะ: ${esc(statusInfo(order.status).label)}</p>
  <script>window.onload=()=>window.print()</script>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
