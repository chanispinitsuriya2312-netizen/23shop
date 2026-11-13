import { useMemo, useState } from 'react'
import { baht } from '../../lib/format'
import { seriesByDay, salesByCategory, topProducts, downloadCsv, ordersToRows, ORDER_CSV_HEADERS } from '../../lib/adminStats'

export default function Reports({ orders, products }) {
  const [days, setDays] = useState(30)
  const since = Date.now() - days * 86400000
  const scoped = useMemo(() => orders.filter((o) => Number(o.createdAt) >= since), [orders, since])
  const series = useMemo(() => seriesByDay(scoped, days), [scoped, days])
  const cats = useMemo(() => salesByCategory(scoped, products), [scoped, products])
  const top = useMemo(() => topProducts(scoped, 8), [scoped])

  const revenue = scoped.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0)
  const discounts = scoped.reduce((s, o) => s + (Number(o.discountAmount) || 0), 0)
  const shipping = scoped.reduce((s, o) => s + (Number(o.shippingFee) || 0), 0)
  const delivered = scoped.filter((o) => o.status === 'Delivered').length
  const max = Math.max(1, ...series.map((s) => s.total))
  const catMax = Math.max(1, ...cats.map((c) => c.revenue))

  const w = 640
  const h = 160
  const gap = series.length > 40 ? 1 : 5
  const bw = (w - gap * (series.length - 1)) / series.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Reports</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">รายงานยอดขาย</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-xl border border-ink-200 bg-white px-2.5 py-2 text-sm">
            <option value={7}>7 วัน</option>
            <option value={30}>30 วัน</option>
            <option value={90}>90 วัน</option>
            <option value={365}>1 ปี</option>
          </select>
          <button
            onClick={() => downloadCsv(`report-${days}d-${Date.now()}.csv`, ORDER_CSV_HEADERS, ordersToRows(scoped))}
            className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-600 hover:border-brand hover:text-brand"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Box label="ยอดขายรวม" value={baht(revenue)} />
        <Box label="ออเดอร์" value={scoped.length} sub={`สำเร็จ ${delivered}`} />
        <Box label="ส่วนลดรวม" value={baht(discounts)} />
        <Box label="ค่าส่งรวม" value={baht(shipping)} />
      </div>

      <div className="card-surface p-5">
        <p className="text-sm font-bold text-ink-900">ยอดขายรายวัน</p>
        <svg viewBox={`0 0 ${w} ${h + 20}`} className="mt-3 w-full">
          <line x1="0" x2={w} y1={h} y2={h} stroke="#eceae6" />
          {series.map((s, i) => {
            const bh = Math.max(1, (s.total / max) * (h - 6))
            return (
              <rect key={s.key} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx="2" fill={s.total > 0 ? '#ff5722' : '#eceae6'}>
                <title>{`${s.label}: ${baht(s.total)}`}</title>
              </rect>
            )
          })}
        </svg>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface p-5">
          <p className="text-sm font-bold text-ink-900">ยอดขายตามหมวดหมู่</p>
          <div className="mt-3 space-y-2.5">
            {cats.length === 0 && <p className="py-6 text-center text-xs text-ink-400">ยังไม่มีข้อมูล</p>}
            {cats.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-ink-700">{c.category}</span>
                  <span className="text-ink-500">{baht(c.revenue)} · {c.quantity} ชิ้น</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(c.revenue / catMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="text-sm font-bold text-ink-900">สินค้าขายดี</p>
          <div className="mt-3 space-y-1.5">
            {top.length === 0 && <p className="py-6 text-center text-xs text-ink-400">ยังไม่มีข้อมูล</p>}
            {top.map((t, i) => (
              <div key={t.title} className="flex items-center gap-2 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-panel text-[11px] font-bold text-white">{i + 1}</span>
                <span className="line-clamp-1 flex-1 text-xs text-ink-700">{t.title}</span>
                <span className="text-xs text-ink-400">x{t.quantity}</span>
                <span className="text-xs font-bold text-ink-900">{baht(t.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Box({ label, value, sub }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink-900">{value}</p>
      {sub && <p className="text-[11px] text-ink-400">{sub}</p>}
    </div>
  )
}
