import { useEffect, useState } from 'react'
import { subscribePayment, savePayment, defaultPayment } from '../../lib/promptpay'

export default function Payment() {
  const [form, setForm] = useState(defaultPayment)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => subscribePayment((c) => setForm({ ...defaultPayment, ...c })), [])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    try {
      await savePayment(form)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Payments</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">ตั้งค่า PromptPay</h1>
        <p className="mt-1 text-sm text-ink-400">
          กำหนดพร้อมเพย์ปลายทาง ระบบสร้าง QR พร้อมยอดเงินอัตโนมัติ (ฟรี ไม่มีค่าธรรมเนียม)
        </p>
      </div>

      <div className="card-surface max-w-xl p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-600">หมายเลข PromptPay (เบอร์ หรือเลขบัตร 13 หลัก)</span>
          <input value={form.promptPayId} onChange={(e) => set('promptPayId', e.target.value)} className="input" placeholder="เช่น 0812345678" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-ink-600">ชื่อร้าน/ผู้รับเงิน</span>
          <input value={form.merchantName} onChange={(e) => set('merchantName', e.target.value)} className="input" placeholder="ShopHub" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-ink-600">คำแนะนำใต้ QR</span>
          <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} className="input" />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={form.enabled !== false} onChange={(e) => set('enabled', e.target.checked)} />
          เปิดใช้ PromptPay เป็นช่องทางชำระเงิน
        </label>
        <button onClick={save} disabled={saving} className="mt-5 rounded-2xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
        </button>
      </div>
    </div>
  )
}
