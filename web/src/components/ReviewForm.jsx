import { useState } from 'react'
import { createReview, compressPhoto } from '../lib/reviews'
import { useToast } from '../context/ToastContext'

export default function ReviewForm({ productId }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const [saving, setSaving] = useState(false)

  async function pickPhotos(e) {
    const files = [...(e.target.files || [])].slice(0, 3 - photos.length)
    const next = []
    for (const f of files) {
      try {
        next.push(await compressPhoto(f))
      } catch {
        toast.error('อ่านรูปไม่สำเร็จ')
      }
    }
    setPhotos((p) => [...p, ...next].slice(0, 3))
    e.target.value = ''
  }

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || !text.trim()) {
      toast.error('กรอกชื่อและข้อความรีวิวก่อน')
      return
    }
    setSaving(true)
    try {
      await createReview({ productId, orderCode, name, rating, text, photos })
      toast.success('ส่งรีวิวแล้ว — รอแอดมินอนุมัติ')
      setOpen(false)
      setName('')
      setOrderCode('')
      setRating(5)
      setText('')
      setPhotos([])
    } catch (err) {
      toast.error('ส่งรีวิวไม่สำเร็จ: ' + (err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-1 w-full rounded-xl border border-dashed border-ink-200 py-2.5 text-sm font-medium text-ink-500 hover:border-brand hover:text-brand">
        + เขียนรีวิวสินค้านี้
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-ink-100 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อที่แสดง" className="input" />
        <input value={orderCode} onChange={(e) => setOrderCode(e.target.value)} placeholder="Order code (ไม่บังคับ)" className="input" />
      </div>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className={`text-2xl leading-none ${n <= rating ? 'text-amber-400' : 'text-ink-200'}`} aria-label={`${n} ดาว`}>
            ★
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} placeholder="เล่าประสบการณ์ใช้สินค้า…" className="input mt-2" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative">
            <img src={p} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <button type="button" onClick={() => setPhotos((ph) => ph.filter((_, x) => x !== i))} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-panel text-[10px] text-white">
              ✕
            </button>
          </div>
        ))}
        {photos.length < 3 && (
          <label className="grid h-14 w-14 cursor-pointer place-items-center rounded-lg border border-dashed border-ink-200 text-xs text-ink-400">
            + รูป
            <input type="file" accept="image/*" multiple className="hidden" onChange={pickPhotos} />
          </label>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-500">
          ยกเลิก
        </button>
      </div>
    </form>
  )
}
