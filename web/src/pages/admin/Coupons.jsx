import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { baht, formatDate } from '../../lib/format'

const emptyForm = () => ({
  code: '',
  active: true,
  type: 'percent',
  value: 10,
  minSpend: 0,
  maxDiscount: 0,
  startsAt: '',
  endsAt: '',
  usageLimit: 0,
  usedCount: 0,
  productIds: []
})

const toLocalInput = (ms) => {
  if (!ms) return ''
  const d = new Date(Number(ms))
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export default function Coupons({ products }) {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'coupons'),
      (snap) => setCoupons(snap.docs.map((d) => ({ id: d.id, code: d.id, ...d.data() }))),
      (err) => console.warn('[coupons] listener error:', err?.message)
    )
    return unsub
  }, [])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    const code = String(form.code || '').trim().toUpperCase()
    if (!code) {
      setError('กรุณากรอกรหัสคูปอง')
      return
    }
    setSaving(true)
    setError('')
    try {
      await setDoc(doc(db, 'coupons', code), {
        code,
        active: form.active !== false,
        type: form.type === 'amount' ? 'amount' : 'percent',
        value: Number(form.value) || 0,
        minSpend: Number(form.minSpend) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        startsAt: form.startsAt ? new Date(form.startsAt).getTime() : 0,
        endsAt: form.endsAt ? new Date(form.endsAt).getTime() : 0,
        usageLimit: Number(form.usageLimit) || 0,
        usedCount: Number(form.usedCount) || 0,
        productIds: form.productIds || [],
        updatedAt: Date.now(),
        createdAt: form.createdAt || Date.now()
      })
      setForm(null)
    } catch (e) {
      setError('บันทึกไม่สำเร็จ: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  async function toggle(c) {
    await setDoc(doc(db, 'coupons', c.id), { active: !c.active, updatedAt: Date.now() }, { merge: true })
  }

  const isLive = (c) => {
    const now = Date.now()
    return c.active !== false && (!c.startsAt || c.startsAt <= now) && (!c.endsAt || c.endsAt >= now)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Coupons</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">คูปองส่วนลด</h1>
          <p className="mt-1 text-xs text-ink-400">{coupons.length} โค้ด · ใช้ร่วมกับแคมเปญหลักได้</p>
        </div>
        <button onClick={() => setForm(emptyForm())} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          + สร้างคูปอง
        </button>
      </div>

      {coupons.length === 0 ? (
        <p className="py-16 text-center text-ink-400">ยังไม่มีคูปอง — สร้างโค้ดแรกได้เลย</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => (
            <div key={c.id} className="card-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-lg font-extrabold tracking-wide text-ink-900">{c.code}</p>
                  <p className="text-xs text-ink-400">
                    {c.type === 'amount' ? `ลด ${baht(c.value)}` : `ลด ${c.value}%`}
                    {c.minSpend > 0 && ` · ขั้นต่ำ ${baht(c.minSpend)}`}
                    {c.maxDiscount > 0 && ` · สูงสุด ${baht(c.maxDiscount)}`}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isLive(c) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isLive(c) ? 'ใช้งาน' : 'ปิด/หมดอายุ'}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-ink-400">
                ใช้แล้ว {c.usedCount || 0}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
                {c.endsAt ? ` · ถึง ${formatDate(c.endsAt)}` : ''}
              </p>
              <div className="mt-3 flex gap-1.5">
                <button onClick={() => setForm({ ...emptyForm(), ...c, startsAt: toLocalInput(c.startsAt), endsAt: toLocalInput(c.endsAt) })} className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200">แก้ไข</button>
                <button onClick={() => toggle(c)} className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200">{c.active !== false ? 'ปิดใช้' : 'เปิดใช้'}</button>
                <button
                  onClick={() => {
                    if (confirm(`ลบคูปอง ${c.code} ?`)) deleteDoc(doc(db, 'coupons', c.id))
                  }}
                  className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{form.id ? 'แก้ไขคูปอง' : 'สร้างคูปองใหม่'}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="รหัสคูปอง" full>
                <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className="input font-mono uppercase" placeholder="เช่น SAVE50" disabled={!!form.id} />
              </Field>
              <Field label="ชนิด">
                <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input">
                  <option value="percent">เปอร์เซ็นต์ (%)</option>
                  <option value="amount">จำนวนเงิน (บาท)</option>
                </select>
              </Field>
              <Field label="มูลค่าส่วนลด">
                <input type="number" value={form.value} onChange={(e) => set('value', e.target.value)} className="input" />
              </Field>
              <Field label="ยอดขั้นต่ำ (บาท)">
                <input type="number" value={form.minSpend} onChange={(e) => set('minSpend', e.target.value)} className="input" />
              </Field>
              <Field label="ลดสูงสุด (0 = ไม่จำกัด)">
                <input type="number" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} className="input" />
              </Field>
              <Field label="เริ่มใช้">
                <input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} className="input" />
              </Field>
              <Field label="หมดอายุ">
                <input type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} className="input" />
              </Field>
              <Field label="จำกัดจำนวนใช้ (0 = ไม่จำกัด)">
                <input type="number" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} className="input" />
              </Field>
              <Field label="ใช้แล้ว">
                <input type="number" value={form.usedCount} onChange={(e) => set('usedCount', e.target.value)} className="input" />
              </Field>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink-600">
              <input type="checkbox" checked={form.active !== false} onChange={(e) => set('active', e.target.checked)} />
              เปิดใช้งาน
            </label>

            {products.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-ink-500">จำกัดสินค้า (ไม่เลือก = ทุกสินค้า)</p>
                <div className="mt-1 max-h-36 space-y-0.5 overflow-y-auto rounded-xl border border-ink-200 p-2">
                  {products.map((p) => {
                    const ids = (form.productIds || []).map(String)
                    const checked = ids.includes(String(p.id))
                    return (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-ink-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            set('productIds', checked ? ids.filter((x) => x !== String(p.id)) : [...ids, String(p.id)])
                          }
                        />
                        <span className="line-clamp-1 flex-1 text-ink-600">{p.title}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {error && <p className="mt-3 rounded-xl bg-red-50 p-2 text-xs text-red-600">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button onClick={() => setForm(null)} className="flex-1 rounded-2xl border border-ink-200 py-2.5 font-medium text-ink-600">ยกเลิก</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-2xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, full }) {
  return (
    <label className={`block ${full ? 'col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-medium text-ink-500">{label}</span>
      {children}
    </label>
  )
}
