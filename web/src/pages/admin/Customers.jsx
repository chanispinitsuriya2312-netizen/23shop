import { useMemo } from 'react'
import { baht, formatDate } from '../../lib/format'
import { computeCustomers, downloadCsv } from '../../lib/adminStats'

export default function Customers({ orders }) {
  const customers = useMemo(() => computeCustomers(orders), [orders])
  const totalSpent = customers.reduce((s, c) => s + c.spent, 0)
  const repeat = customers.filter((c) => c.orders > 1).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Customers</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">ลูกค้า</h1>
          <p className="mt-1 text-xs text-ink-400">
            {customers.length} คน · ซื้อซ้ำ {repeat} คน · ยอดรวม {baht(totalSpent)}
          </p>
        </div>
        <button
          onClick={() =>
            downloadCsv(
              `customers-${Date.now()}.csv`,
              ['ชื่อ', 'เบอร์โทร', 'ที่อยู่', 'จำนวนออเดอร์', 'ยอดรวม', 'ล่าสุด'],
              customers.map((c) => [c.name, c.phone, c.address, c.orders, c.spent, formatDate(c.lastOrderAt)])
            )
          }
          className="rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-600 hover:border-brand hover:text-brand"
        >
          Export CSV
        </button>
      </div>

      {customers.length === 0 ? (
        <p className="py-16 text-center text-ink-400">ยังไม่มีข้อมูลลูกค้า</p>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                <th className="px-4 py-2.5 font-medium">ลูกค้า</th>
                <th className="px-4 py-2.5 font-medium">ที่อยู่ล่าสุด</th>
                <th className="px-4 py-2.5 text-right font-medium">ออเดอร์</th>
                <th className="px-4 py-2.5 text-right font-medium">ยอดรวม</th>
                <th className="px-4 py-2.5 text-right font-medium">ล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone + c.name} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink-800">{c.name}</p>
                    <p className="text-xs text-ink-400">{c.phone}</p>
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-xs text-ink-500">{c.address}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.orders > 1 ? 'bg-brand/10 text-brand' : 'bg-ink-100 text-ink-500'}`}>
                      {c.orders}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-ink-800">{baht(c.spent)}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-ink-400">{formatDate(c.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
