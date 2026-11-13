import { useEffect, useState } from 'react'
import { subscribeCampaign, saveCampaign, defaultCampaign } from '../../lib/campaign'
import { baht } from '../../lib/format'

const toLocalInput = (ms) => {
  const d = new Date(Number(ms) || Date.now())
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export default function Campaign({ products = [] }) {
  const [form, setForm] = useState(defaultCampaign)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    return subscribeCampaign((c) => {
      setForm((prev) => (loaded ? prev : c))
      setLoaded(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  const isProducts = form.scope === 'products'
  const isAmount = form.discountType === 'amount'
  const selectedIds = (form.productIds || []).map(String)

  function toggleProduct(id) {
    const key = String(id)
    set('productIds', (selectedIds.includes(key) ? selectedIds.filter((x) => x !== key) : [...selectedIds, key]).map(Number))
  }

  async function save() {
    setSaving(true)
    try {
      await saveCampaign(form)
      setSaved(true)
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Promotion</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">แคมเปญ / Flash Sale</h1>
        <p className="mt-1 text-sm text-ink-400">ป๊อปอัพนับถอยหลัง + โค้ดส่วนลดบนหน้าร้าน</p>
      </div>

      <div className="card-surface max-w-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink-900">รายละเอียดแคมเปญ</h2>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={!!form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4" />
            เปิดใช้งาน
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <CField label="หัวข้อป๊อปอัพ">
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </CField>
          <CField label="ข้อความ CTA (ปุ่ม)">
            <input className="input" value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} />
          </CField>
          <CField label="คำโปรย (subtitle)" full>
            <input className="input" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
          </CField>
          <CField label="โค้ดส่วนลด">
            <input className="input uppercase" value={form.promoCode} onChange={(e) => set('promoCode', e.target.value.toUpperCase())} />
          </CField>
          <CField label="รูปแบบแคมเปญ">
            <select className="input" value={form.scope || 'cart'} onChange={(e) => set('scope', e.target.value)}>
              <option value="cart">ลดทั้งตะกร้า</option>
              <option value="products">เฉพาะสินค้าที่เลือก</option>
            </select>
          </CField>
          <CField label="ชนิดส่วนลด">
            <select className="input" value={form.discountType || 'percent'} onChange={(e) => set('discountType', e.target.value)}>
              <option value="percent">เปอร์เซ็นต์ (%)</option>
              <option value="amount">จำนวนเงินต่อชิ้น (บาท)</option>
            </select>
          </CField>
          {isAmount ? (
            <CField label="ลดต่อชิ้น (บาท)">
              <input type="number" className="input" value={form.discountAmountPerItem} onChange={(e) => set('discountAmountPerItem', e.target.value)} />
            </CField>
          ) : (
            <CField label="ส่วนลด (%)">
              <input type="number" className="input" value={form.discountPercent} onChange={(e) => set('discountPercent', e.target.value)} />
            </CField>
          )}
          <CField label="ยอดขั้นต่ำ (บาท)">
            <input type="number" className="input" value={form.minSpend} onChange={(e) => set('minSpend', e.target.value)} />
          </CField>
          <CField label="ลดสูงสุด (บาท, 0 = ไม่จำกัด)">
            <input type="number" className="input" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
          </CField>
          <CField label="สิ้นสุดแคมเปญ" full>
            <input type="datetime-local" className="input" value={toLocalInput(form.endsAt)} onChange={(e) => set('endsAt', new Date(e.target.value).getTime())} />
          </CField>
        </div>

        {isProducts && (
          <div className="mt-4">
            <p className="text-xs font-medium text-ink-500">เลือกสินค้าร่วมแคมเปญ ({selectedIds.length} รายการ)</p>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ink-200 p-2">
              {products.length === 0 && <p className="p-2 text-sm text-ink-400">ยังไม่มีสินค้าในระบบ</p>}
              {products.map((p) => {
                const pid = p.id ?? p.productId
                return (
                  <label key={pid} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-50">
                    <input type="checkbox" checked={selectedIds.includes(String(pid))} onChange={() => toggleProduct(pid)} className="h-4 w-4" />
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                    <span className="flex-1 truncate text-sm text-ink-700">{p.title}</span>
                    <span className="text-sm font-medium text-ink-500">{baht(p.price)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button onClick={save} disabled={saving} className="rounded-xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
            {saving ? 'กำลังบันทึก...' : 'บันทึกแคมเปญ'}
          </button>
          {saved && <span className="text-sm font-medium text-green-600">บันทึกแล้ว ✓</span>}
        </div>
      </div>
    </div>
  )
}

function CField({ label, children, full }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
