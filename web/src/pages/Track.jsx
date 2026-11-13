import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { db } from '../firebase'
import { statusInfo, formatDate } from '../lib/format'
import { useSeo } from '../lib/seo'

const STEPS = ['Order Placed', 'Processing', 'Shipped', 'Delivered']

export default function Track() {
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get('code') || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useSeo({ title: 'ติดตามพัสดุ', description: 'ตรวจสอบสถานะคำสั่งซื้อ ShopHub ด้วยหมายเลขคำสั่งซื้อ', canonical: '/track' })

  async function lookup(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    const key = code.trim().toUpperCase()
    if (!key) return
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'tracking', key))
      if (snap.exists()) setResult({ id: snap.id, ...snap.data() })
      else setError('ไม่พบข้อมูลคำสั่งซื้อนี้ — ตรวจสอบหมายเลขอีกครั้ง หรือติดต่อร้านผ่าน LINE')
    } catch {
      setError('ยังไม่สามารถตรวจสอบได้ในขณะนี้ กรุณาลองใหม่ภายหลัง')
    } finally {
      setLoading(false)
    }
  }

  const currentIdx = result ? STEPS.indexOf(result.status) : -1

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="eyebrow">Order Tracking</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">ติดตามพัสดุ</h1>
        <p className="mt-2 text-sm text-ink-500">กรอกหมายเลขคำสั่งซื้อ เช่น SH-98124</p>

        <form onSubmit={lookup} className="mt-5 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="SH-xxxxx"
            className="input flex-1 uppercase"
          />
          <button type="submit" disabled={loading} className="btn-primary shrink-0 px-6 disabled:opacity-60">
            {loading ? 'กำลังค้นหา...' : 'ตรวจสอบ'}
          </button>
        </form>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-6 card-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-ink-900">{result.orderCode}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo(result.status).color}`}>
                {statusInfo(result.status).label}
              </span>
            </div>

            <ol className="mt-6 space-y-0">
              {STEPS.map((s, i) => {
                const done = i <= currentIdx
                return (
                  <li key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-brand text-white' : 'bg-ink-100 text-ink-400'}`}>
                        {done ? '✓' : i + 1}
                      </span>
                      {i < STEPS.length - 1 && <span className={`h-8 w-px ${i < currentIdx ? 'bg-brand' : 'bg-ink-100'}`} />}
                    </div>
                    <p className={`pt-0.5 text-sm ${done ? 'font-semibold text-ink-900' : 'text-ink-400'}`}>
                      {statusInfo(s).label}
                    </p>
                  </li>
                )
              })}
            </ol>

            {(result.courier || result.trackingNumber) && (
              <div className="mt-5 rounded-xl bg-ink-50 p-4 text-sm">
                <p className="font-semibold text-ink-800">ข้อมูลการจัดส่ง</p>
                <p className="mt-1 text-ink-500">
                  {result.courier || '-'} · เลขพัสดุ <span className="font-mono font-semibold text-ink-800">{result.trackingNumber || '-'}</span>
                </p>
              </div>
            )}

            <p className="mt-4 text-xs text-ink-400">อัปเดตล่าสุด {formatDate(result.updatedAt)}</p>
          </div>
        )}

        <Link to="/" className="mt-8 inline-block text-sm font-semibold text-brand hover:underline">
          ← กลับหน้าร้าน
        </Link>
      </main>
      <Footer />
    </div>
  )
}
