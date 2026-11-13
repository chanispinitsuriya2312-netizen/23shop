import { useEffect, useState } from 'react'
import { subscribeSettings, saveSettings, defaultSettings } from '../../lib/settings'

export default function Settings() {
  const [form, setForm] = useState(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => subscribeSettings((c) => setForm({ ...defaultSettings, ...c })), [])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await saveSettings(form)
      setSaved(true)
    } catch (e) {
      setError('บันทึกไม่สำเร็จ: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">ตั้งค่าร้าน</h1>
      </div>

      <Section title="ข้อมูลร้าน" desc="แสดงใน Navbar, Footer และหน้าติดต่อ">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ชื่อร้าน" value={form.storeName} onChange={(v) => set('storeName', v)} />
          <Field label="เบอร์โทร" value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label="LINE ID" value={form.lineId} onChange={(v) => set('lineId', v)} />
          <Field label="Facebook URL" value={form.facebook} onChange={(v) => set('facebook', v)} />
          <Field label="Instagram URL" value={form.instagram} onChange={(v) => set('instagram', v)} />
        </div>
        <Field label="ข้อความแถบประกาศ (Announcement bar)" value={form.announcement} onChange={(v) => set('announcement', v)} className="mt-3" />
      </Section>

      <Section title="การจัดส่ง" desc="ใช้คำนวณค่าส่งในตะกร้า/ชำระเงิน">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="ค่าส่ง (บาท)" type="number" value={form.shippingFee} onChange={(v) => set('shippingFee', v)} />
          <Field label="ยอดขั้นต่ำส่งฟรี (บาท)" type="number" value={form.freeShippingMin} onChange={(v) => set('freeShippingMin', v)} />
          <label className="flex items-end gap-2 pb-2 text-sm text-ink-600">
            <input type="checkbox" checked={form.codEnabled !== false} onChange={(e) => set('codEnabled', e.target.checked)} />
            เปิดเก็บเงินปลายทาง
          </label>
        </div>
      </Section>

      <Section title="การแสดงผลหน้าร้าน" desc="ปรับรายละเอียดบนการ์ดสินค้า">
        <label className="flex items-start gap-3 rounded-xl border border-ink-100 p-3">
          <input type="checkbox" checked={form.showStockOnCard !== false} onChange={(e) => set('showStockOnCard', e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>
            <span className="block text-sm font-medium text-ink-700">แสดงยอดคงเหลือบนการ์ดสินค้า</span>
            <span className="block text-xs text-ink-400">แสดง “คงเหลือ” ข้างดาวรีวิวบนการ์ดในหน้าร้าน</span>
          </span>
        </label>
      </Section>

      <Section title="เครื่องมือวัดผล (Analytics)" desc="วาง ID แล้วระบบจะโหลดสคริปต์ให้เอง — เว้นว่างได้">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="GA4 Measurement ID" value={form.ga4Id} onChange={(v) => set('ga4Id', v)} placeholder="G-XXXXXXXXXX" />
          <Field label="Meta Pixel ID" value={form.metaPixelId} onChange={(v) => set('metaPixelId', v)} placeholder="1234567890" />
          <Field label="TikTok Pixel ID" value={form.tiktokPixelId} onChange={(v) => set('tiktokPixelId', v)} placeholder="CXXXXXXXXXXXX" />
        </div>
      </Section>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-2xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
        </button>
        {saved && <span className="text-sm font-medium text-green-600">บันทึกแล้ว ✓</span>}
      </div>
    </div>
  )
}

function Section({ title, desc, children }) {
  return (
    <div className="card-surface p-5">
      <p className="text-sm font-bold text-ink-900">{title}</p>
      {desc && <p className="mt-0.5 text-xs text-ink-400">{desc}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-ink-500">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </label>
  )
}
