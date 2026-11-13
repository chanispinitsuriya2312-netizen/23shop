import { useEffect, useState } from 'react'
import { subscribeApprovedReviews, reviewStats } from '../lib/reviews'
import { formatDate } from '../lib/format'

export default function ReviewList({ productId, reviews: given }) {
  const [fetched, setFetched] = useState([])

  useEffect(() => {
    if (given) return undefined
    setFetched([])
    return subscribeApprovedReviews(productId, setFetched)
  }, [productId, given])

  const reviews = given || fetched

  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl bg-ink-50 p-4 text-center text-sm text-ink-400">
        ยังไม่มีรีวิวที่ผ่านการอนุมัติ — เขียนรีวิวแรกได้เลย
      </p>
    )
  }

  const stats = reviewStats(reviews)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3">
        <p className="text-2xl font-extrabold text-ink-900">{stats.avg}</p>
        <div>
          <Stars value={stats.avg} />
          <p className="text-xs text-ink-400">จาก {stats.count} รีวิว</p>
        </div>
      </div>
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-ink-100 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-800">{r.name || 'ลูกค้า'}</p>
            <Stars value={r.rating} />
          </div>
          {r.orderCode && <p className="text-[11px] text-ink-400">ออเดอร์ {r.orderCode} · {formatDate(r.createdAt)}</p>}
          {r.text && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-600">{r.text}</p>}
          {r.photos?.length > 0 && (
            <div className="mt-2 flex gap-2">
              {r.photos.map((p, i) => (
                <img key={i} src={p} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Stars({ value }) {
  const n = Math.round(Number(value) || 0)
  return (
    <span className="text-sm text-amber-400" aria-label={`${value} ดาว`}>
      {'★'.repeat(Math.max(0, Math.min(5, n)))}
      <span className="text-ink-200">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  )
}
