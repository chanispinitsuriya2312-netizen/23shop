import { useEffect, useState } from 'react'
import { subscribeSettings, saveSettings, defaultSettings } from '../../lib/settings'
import { CHANNEL_TYPES, channelType } from '../../lib/channels'
import ChannelIcon from '../../components/ChannelIcon'

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

  const channels = Array.isArray(form.contactChannels) ? form.contactChannels : []

  function setChannels(next) {
    set('contactChannels', next)
  }

  function patchChannel(index, patch) {
    setChannels(channels.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function addChannel() {
    setChannels([...channels, { type: 'line', label: '', value: '', enabled: true }])
  }

  function removeChannel(index) {
    setChannels(channels.filter((_, i) => i !== index))
  }

  function moveChannel(index, dir) {
    const target = index + dir
    if (target < 0 || target >= channels.length) return
    const next = [...channels]
    ;[next[index], next[target]] = [next[target], next[index]]
    setChannels(next)
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

      <Section title="ช่องทางติดต่อ" desc="แสดงในแผง “ติดต่อร้าน” ที่เลื่อนออกมาจากขอบขวา — เพิ่ม ลบ เรียงลำดับได้ตามใจ">
        <div className="space-y-2">
          {channels.map((c, i) => {
            const meta = channelType(c.type)
            const enabled = c.enabled !== false
            return (
              <div key={i} className="rounded-xl border border-ink-100 bg-white p-3 shadow-soft">
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    <ChannelIcon name={meta.icon} size={17} />
                  </span>
                  <select
                    value={c.type}
                    onChange={(e) => patchChannel(i, { type: e.target.value })}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-2 text-sm text-ink-700 outline-none focus:border-brand"
                    aria-label="ประเภทช่องทาง"
                  >
                    {CHANNEL_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => patchChannel(i, { enabled: !enabled })}
                    role="switch"
                    aria-checked={enabled}
                    aria-label={enabled ? 'ซ่อนช่องทางนี้' : 'แสดงช่องทางนี้'}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${enabled ? 'bg-brand' : 'bg-ink-200'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-[1.15rem]' : 'left-0.5'}`}
                    />
                  </button>
                  <div className="flex shrink-0 items-center">
                    <button onClick={() => moveChannel(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น" className="grid h-7 w-6 place-items-center rounded text-ink-400 hover:bg-ink-50 hover:text-ink-700 disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 14 6-6 6 6" /></svg>
                    </button>
                    <button onClick={() => moveChannel(i, 1)} disabled={i === channels.length - 1} aria-label="เลื่อนลง" className="grid h-7 w-6 place-items-center rounded text-ink-400 hover:bg-ink-50 hover:text-ink-700 disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 10 6 6 6-6" /></svg>
                    </button>
                    <button onClick={() => removeChannel(i)} aria-label="ลบช่องทาง" className="ml-1 grid h-7 w-7 place-items-center rounded text-ink-400 hover:bg-red-50 hover:text-red-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Field label="ชื่อที่แสดง" value={c.label} onChange={(v) => patchChannel(i, { label: v })} placeholder={meta.label} />
                  <Field label="ลิงก์ / ไอดี" value={c.value} onChange={(v) => patchChannel(i, { value: v })} placeholder={meta.placeholder} />
                </div>
              </div>
            )
          })}
          {channels.length === 0 && (
            <p className="rounded-xl bg-ink-50 p-3 text-xs text-ink-400">ยังไม่มีช่องทางติดต่อ — กดเพิ่มด้านล่างได้เลย</p>
          )}
        </div>
        <button
          onClick={addChannel}
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-ink-300 bg-white px-4 text-sm font-semibold text-ink-600 shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-card active:translate-y-0"
        >
          <span className="text-base leading-none">+</span> เพิ่มช่องทางติดต่อ
        </button>
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
