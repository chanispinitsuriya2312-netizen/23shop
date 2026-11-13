import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { baht, formatDate, statusInfo } from '../../lib/format'
import { computeKpis, seriesByDay, lowStock, topProducts } from '../../lib/adminStats'

export default function Dashboard({ orders, products, onGo }) {
  const [range, setRange] = useState(7)
  const k = useMemo(() => computeKpis(orders), [orders])
  const series = useMemo(() => seriesByDay(orders, range), [orders, range])
  const low = useMemo(() => lowStock(products, 5).slice(0, 5), [products])
  const top = useMemo(() => topProducts(orders, 5), [orders])
  const recent = orders.slice(0, 6)

  const max = Math.max(1, ...series.map((s) => s.total))
  const w = 620
  const h = 180
  const gap = 10
  const bw = (w - gap * (series.length - 1)) / series.length

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">ภาพรวมร้าน</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="รายได้วันนี้" value={baht(k.revenueToday)} sub={`${k.ordersToday} ออเดอร์`} />
        <Kpi label="รายได้เดือนนี้" value={baht(k.revenueMonth)} sub={`เฉลี่ย ${baht(k.aov)}/ออเดอร์`} />
        <Kpi label="ออเดอร์ค้าง" value={k.openOrders} sub={`จัดส่งแล้ว ${k.shipped} · สำเร็จ ${k.delivered}`} />
        <Kpi label="สลิปรอตรวจ" value={k.pendingSlips} sub="ตรวจสอบการชำระเงิน" alert={k.pendingSlips > 0} onClick={() => onGo('slips')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink-900">ยอดขาย</p>
              <p className="text-xs text-ink-400">รวม {baht(series.reduce((s, x) => s + x.total, 0))}</p>
            </div>
            <div className="flex gap-1">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${range === d ? 'bg-panel text-white' : 'bg-ink-50 text-ink-500'}`}
                >
                  {d} วัน
                </button>
              ))}
            </div>
          </div>
          <svg viewBox={`0 0 ${w} ${h + 26}`} className="mt-4 w-full">
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <line key={t} x1="0" x2={w} y1={h - h * t} y2={h - h * t} stroke="#eceae6" strokeWidth="1" />
            ))}
            {series.map((s, i) => {
              const bh = Math.max(2, (s.total / max) * (h - 8))
              return (
                <g key={s.key}>
                  <rect x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx="4" fill={s.total > 0 ? '#ff5722' : '#eceae6'} />
                  <text x={i * (bw + gap) + bw / 2} y={h + 18} textAnchor="middle" fontSize="10" fill="#8f8881">
                    {s.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="card-surface p-5">
          <p className="text-sm font-bold text-ink-900">สินค้าใกล้หมด</p>
          <div className="mt-3 space-y-2">
            {low.length === 0 && <p className="py-6 text-center text-xs text-ink-400">สต็อกยังเพียงพอ</p>}
            {low.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-2 rounded-xl bg-ink-50 p-2 hover:bg-ink-100">
                <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                <span className="line-clamp-1 flex-1 text-xs font-medium text-ink-700">{p.title}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${Number(p.stock) <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                  {Number(p.stock) <= 0 ? 'หมด' : p.stock}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card-surface p-5">
          <p className="text-sm font-bold text-ink-900">ออเดอร์ล่าสุด</p>
          <div className="mt-3 space-y-1.5">
            {recent.length === 0 && <p className="py-6 text-center text-xs text-ink-400">ยังไม่มีออเดอร์</p>}
            {recent.map((o) => (
              <button
                key={o.id}
                onClick={() => onGo('orders')}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-ink-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-ink-800">{o.orderCode}</span>
                  <span className="block truncate text-[11px] text-ink-400">{o.customerName} · {formatDate(o.createdAt)}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo(o.status).color}`}>
                  {statusInfo(o.status).label}
                </span>
                <span className="text-sm font-extrabold text-brand">{baht(o.totalAmount)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="text-sm font-bold text-ink-900">สินค้าขายดี</p>
          <div className="mt-3 space-y-1.5">
            {top.length === 0 && <p className="py-6 text-center text-xs text-ink-400">ยังไม่มีข้อมูลการขาย</p>}
            {top.map((t, i) => (
              <div key={t.title} className="flex items-center gap-2 px-2 py-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-panel text-[11px] font-bold text-white">{i + 1}</span>
                <span className="line-clamp-1 flex-1 text-xs font-medium text-ink-700">{t.title}</span>
                <span className="text-[11px] text-ink-400">x{t.quantity}</span>
                <span className="text-xs font-bold text-ink-900">{baht(t.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, alert, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card-surface p-4 text-left transition ${onClick ? 'hover:shadow-lift' : ''} ${alert ? 'ring-2 ring-amber-300' : ''}`}
    >
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>
    </button>
  )
}
