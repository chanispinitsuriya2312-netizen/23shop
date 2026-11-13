import { useEffect, useState } from 'react'
import { subscribeAllReviews, setReviewApproved, deleteReview, reviewStats } from '../../lib/reviews'
import { formatDate } from '../../lib/format'

export default function Reviews({ products }) {
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => subscribeAllReviews(setReviews), [])

  const titleOf = (pid) => products.find((p) => String(p.id) === String(pid))?.title || `#${pid}`
  const pending = reviews.filter((r) => r.approved !== true)
  const approved = reviews.filter((r) => r.approved === true)
  const list = filter === 'pending' ? pending : filter === 'approved' ? approved : reviews
  const stats = reviewStats(approved)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Reviews</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">รีวิวลูกค้า</h1>
          <p className="mt-1 text-xs text-ink-400">
            รออนุมัติ {pending.length} · เผยแพร่แล้ว {approved.length} · คะแนนเฉลี่ย {stats.avg || '-'}
          </p>
        </div>
        <div className="flex gap-1">
          {[
            ['pending', `รออนุมัติ (${pending.length})`],
            ['approved', `เผยแพร่ (${approved.length})`],
            ['all', 'ทั้งหมด']
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filter === k ? 'bg-ink-900 text-white' : 'bg-white text-ink-500 ring-1 ring-ink-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-ink-400">ไม่มีรีวิวในหมวดนี้</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => (
            <div key={r.id} className="card-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{r.name || 'ลูกค้า'}</p>
                  <p className="text-[11px] text-ink-400">
                    {titleOf(r.productId)} · {r.orderCode || 'ไม่ระบุออเดอร์'} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <span className="text-sm text-amber-400">{'★'.repeat(r.rating || 0)}</span>
              </div>
              {r.text && <p className="mt-2 whitespace-pre-line text-sm text-ink-600">{r.text}</p>}
              {r.photos?.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {r.photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {r.approved !== true ? (
                  <button onClick={() => setReviewApproved(r.id, true)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">
                    ✓ อนุมัติ
                  </button>
                ) : (
                  <button onClick={() => setReviewApproved(r.id, false)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-500">
                    ซ่อน
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('ลบรีวิวนี้?')) deleteReview(r.id)
                  }}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
