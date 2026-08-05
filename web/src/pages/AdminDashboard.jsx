import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, logout } from '../lib/useAuth'
import {
  subscribeProducts,
  subscribeOrders,
  upsertProduct,
  deleteProduct,
  updateOrderStatus,
  nextStatus,
  ORDER_STATUSES,
  productMedia,
  setPaymentStatus
} from '../lib/shop'
import { subscribeCampaign, saveCampaign, defaultCampaign } from '../lib/campaign'
import { subscribePayment, savePayment, defaultPayment } from '../lib/promptpay'
import { subscribeSettings, saveSettings, defaultSettings } from '../lib/settings'
import { baht, formatDate, statusInfo } from '../lib/format'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (!loading && !user) navigate('/admin/login')
  }, [loading, user, navigate])

  useEffect(() => {
    if (!user) return undefined
    const u1 = subscribeProducts(setProducts)
    const u2 = subscribeOrders(setOrders)
    return () => {
      u1 && u1()
      u2 && u2()
    }
  }, [user])

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-slate-400">กำลังโหลด...</div>
  }

  const revenue = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-bold text-white">S</span>
            <div>
              <p className="font-extrabold leading-none">แดชบอร์ดแอดมิน</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand hover:text-brand"
            >
              ดูหน้าร้าน
            </button>
            <button
              onClick={() => logout().then(() => navigate('/admin/login'))}
              className="rounded-full bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-900"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="ออเดอร์ทั้งหมด" value={orders.length} />
          <Stat label="รอดำเนินการ" value={orders.filter((o) => o.status !== 'Delivered').length} />
          <Stat label="สินค้าทั้งหมด" value={products.length} />
          <Stat label="ยอดขายรวม" value={baht(revenue)} />
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {[
            ['orders', 'ออเดอร์'],
            ['products', 'สินค้า'],
            ['campaign', 'แคมเปญส่วนลด'],
            ['payment', 'การชำระเงิน'],
            ['settings', 'ตั้งค่าร้าน']
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === k ? 'bg-brand text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'orders' && <OrdersTab orders={orders} />}
          {tab === 'products' && <ProductsTab products={products} />}
          {tab === 'campaign' && <CampaignTab products={products} />}
          {tab === 'payment' && <PaymentTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  )
}

function toLocalInput(ms) {
  const d = new Date(Number(ms) || Date.now())
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

function CampaignTab({ products = [] }) {
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
    const has = selectedIds.includes(key)
    const next = has ? selectedIds.filter((x) => x !== key) : [...selectedIds, key]
    set('productIds', next.map(Number))
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
    <div className="max-w-2xl rounded-2xl bg-white p-6 ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">แคมเปญส่วนลด / Flash Sale</h2>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={!!form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="h-4 w-4"
          />
          เปิดใช้งาน
        </label>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        ตั้งค่าป๊อปอัพนับถอยหลัง + โค้ดส่วนลดที่จะแสดงบนหน้าร้าน (แก้ที่นี่ที่เดียว เห็นทั้งเว็บ)
      </p>

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
          <input
            className="input uppercase"
            value={form.promoCode}
            onChange={(e) => set('promoCode', e.target.value.toUpperCase())}
          />
        </CField>
        <CField label="รูปแบบแคมเปญ">
          <select
            className="input"
            value={form.scope || 'cart'}
            onChange={(e) => set('scope', e.target.value)}
          >
            <option value="cart">ลดทั้งตะกร้า</option>
            <option value="products">เฉพาะสินค้าที่เลือก (ลดเป็นชิ้น/เลหลัง)</option>
          </select>
        </CField>
        <CField label="ชนิดส่วนลด">
          <select
            className="input"
            value={form.discountType || 'percent'}
            onChange={(e) => set('discountType', e.target.value)}
          >
            <option value="percent">ลดเป็นเปอร์เซ็นต์ (%)</option>
            <option value="amount">ลดเป็นจำนวนเงินต่อชิ้น (บาท)</option>
          </select>
        </CField>
        {isAmount ? (
          <CField label="ลดต่อชิ้น (บาท)">
            <input
              type="number"
              className="input"
              value={form.discountAmountPerItem}
              onChange={(e) => set('discountAmountPerItem', e.target.value)}
            />
          </CField>
        ) : (
          <CField label="ส่วนลด (%)">
            <input
              type="number"
              className="input"
              value={form.discountPercent}
              onChange={(e) => set('discountPercent', e.target.value)}
            />
          </CField>
        )}
        <CField label="ยอดขั้นต่ำ (บาท)">
          <input
            type="number"
            className="input"
            value={form.minSpend}
            onChange={(e) => set('minSpend', e.target.value)}
          />
        </CField>
        <CField label="ลดสูงสุด (บาท, 0 = ไม่จำกัด)">
          <input
            type="number"
            className="input"
            value={form.maxDiscount}
            onChange={(e) => set('maxDiscount', e.target.value)}
          />
        </CField>
        <CField label="สิ้นสุดแคมเปญ" full>
          <input
            type="datetime-local"
            className="input"
            value={toLocalInput(form.endsAt)}
            onChange={(e) => set('endsAt', new Date(e.target.value).getTime())}
          />
        </CField>
      </div>

      {isProducts && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">
            เลือกสินค้าร่วมแคมเปญ ({selectedIds.length} รายการ)
          </p>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {products.length === 0 && (
              <p className="p-2 text-sm text-slate-400">ยังไม่มีสินค้าในระบบ</p>
            )}
            {products.map((p) => {
              const pid = p.id ?? p.productId
              return (
                <label
                  key={pid}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(String(pid))}
                    onChange={() => toggleProduct(pid)}
                    className="h-4 w-4"
                  />
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  )}
                  <span className="flex-1 truncate text-sm">{p.title}</span>
                  <span className="text-sm font-medium text-slate-500">{baht(p.price)}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกแคมเปญ'}
        </button>
        {saved && <span className="text-sm font-medium text-green-600">บันทึกแล้ว ✓</span>}
      </div>
    </div>
  )
}

function CField({ label, children, full }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-800">{value}</p>
    </div>
  )
}

function PaymentTab() {
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
    <div className="max-w-xl rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <h2 className="text-lg font-bold">ตั้งค่า PromptPay</h2>
      <p className="mt-1 text-sm text-slate-500">
        กำหนดหมายเลขพร้อมเพย์ปลายทางที่จะให้ลูกค้าโอนเข้า ระบบจะสร้าง QR พร้อมยอดเงินอัตโนมัติ (ฟรี ไม่มีค่าธรรมเนียม)
      </p>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-600">
          หมายเลข PromptPay (เบอร์มือถือ หรือเลขบัตรประชาชน/ผู้เสียภาษี 13 หลัก)
        </span>
        <input
          value={form.promptPayId}
          onChange={(e) => set('promptPayId', e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder="เช่น 0812345678"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium text-slate-600">ชื่อร้าน/ผู้รับเงิน</span>
        <input
          value={form.merchantName}
          onChange={(e) => set('merchantName', e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder="ShopHub"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium text-slate-600">คำแนะนำใต้ QR</span>
        <textarea
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.enabled !== false}
          onChange={(e) => set('enabled', e.target.checked)}
        />
        เปิดใช้ PromptPay เป็นช่องทางชำระเงิน
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 rounded-2xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
      </button>
    </div>
  )
}

function SettingsTab() {
  const [form, setForm] = useState(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => subscribeSettings((c) => setForm({ ...defaultSettings, ...c })), [])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    try {
      await saveSettings(form)
      setSaved(true)
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <h2 className="text-lg font-bold">ตั้งค่าการแสดงผลหน้าร้าน</h2>
      <p className="mt-1 text-sm text-slate-500">
        ปรับการแสดงข้อมูลบนการ์ดสินค้าในหน้าร้าน (แก้ที่นี่ที่เดียว เห็นทั้งเว็บ)
      </p>

      <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-3">
        <input
          type="checkbox"
          checked={form.showStockOnCard !== false}
          onChange={(e) => set('showStockOnCard', e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-medium text-slate-700">แสดงยอดคงเหลือบนการ์ดสินค้า</span>
          <span className="block text-xs text-slate-400">
            แสดงจำนวน “คงเหลือ” ข้างๆ ดาวรีวิวบนการ์ดสินค้าในหน้าร้าน
          </span>
        </span>
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 rounded-2xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
      </button>
    </div>
  )
}

const PAYMENT_LABELS = {
  paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-700' },
  pending_review: { label: 'รอตรวจสลิป', color: 'bg-amber-100 text-amber-700' },
  unpaid: { label: 'ยังไม่ชำระ', color: 'bg-red-100 text-red-600' },
  cod: { label: 'เก็บปลายทาง', color: 'bg-slate-100 text-slate-500' }
}

function OrdersTab({ orders }) {
  const [busy, setBusy] = useState('')
  const [slipView, setSlipView] = useState('')

  async function pay(o, status) {
    setBusy(o.id)
    try {
      await setPaymentStatus(o.id, status)
    } finally {
      setBusy('')
    }
  }

  async function advance(o) {
    const ns = nextStatus(o.status)
    if (ns === o.status) return
    setBusy(o.id)
    try {
      await updateOrderStatus(o.id, ns)
    } finally {
      setBusy('')
    }
  }

  async function setStatus(o, status) {
    setBusy(o.id)
    try {
      await updateOrderStatus(o.id, status)
    } finally {
      setBusy('')
    }
  }

  if (orders.length === 0) {
    return <p className="py-16 text-center text-slate-400">ยังไม่มีออเดอร์</p>
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const info = statusInfo(o.status)
        return (
          <div key={o.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{o.orderCode}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.color}`}>
                    {info.label}
                  </span>
                  {o.source === 'web' && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">เว็บ</span>
                  )}
                  {(() => {
                    const p = PAYMENT_LABELS[o.paymentStatus] || PAYMENT_LABELS.unpaid
                    return (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.color}`}>
                        {p.label}
                      </span>
                    )
                  })()}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {o.customerName} · {o.customerPhone}
                </p>
                <p className="text-xs text-slate-400">{o.shippingAddress}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-brand">{baht(o.totalAmount)}</p>
                <p className="text-xs text-slate-400">{(o.items || []).length} รายการ</p>
              </div>
            </div>

            {(o.items || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {o.items.map((it, i) => (
                  <span key={i} className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">
                    {it.title} ×{it.quantity}
                  </span>
                ))}
              </div>
            )}

            {(o.slipDataUrl || o.paymentStatus === 'pending_review') && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3">
                {o.slipDataUrl ? (
                  <img
                    src={o.slipDataUrl}
                    alt="สลิปการโอน"
                    onClick={() => setSlipView(o.slipDataUrl)}
                    className="h-20 w-20 cursor-zoom-in rounded-lg object-cover ring-1 ring-amber-200"
                  />
                ) : (
                  <span className="text-sm text-amber-700">รอลูกค้าแนบสลิป</span>
                )}
                <div className="flex flex-col gap-1 text-xs text-amber-700">
                  <span>ลูกค้าแนบสลิปแล้ว — ตรวจสอบยอด {baht(o.totalAmount)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => pay(o, 'paid')}
                      disabled={busy === o.id || o.paymentStatus === 'paid'}
                      className="rounded-lg bg-green-600 px-3 py-1 font-semibold text-white disabled:opacity-50"
                    >
                      ✓ ยืนยันรับเงิน
                    </button>
                    <button
                      onClick={() => pay(o, 'unpaid')}
                      disabled={busy === o.id}
                      className="rounded-lg border border-amber-300 px-3 py-1 font-medium text-amber-700"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => advance(o)}
                disabled={busy === o.id || o.status === 'Delivered'}
                className="rounded-xl bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                เลื่อนสถานะถัดไป →
              </button>
              <select
                value={ORDER_STATUSES.includes(o.status) ? o.status : ''}
                onChange={(e) => setStatus(o, e.target.value)}
                disabled={busy === o.id}
                className="rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="" disabled>
                  เลือกสถานะ
                </option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusInfo(s).label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )
      })}

      {slipView && (
        <div
          onClick={() => setSlipView('')}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
        >
          <img src={slipView} alt="สลิป" className="max-h-[90vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  )
}

function ProductsTab({ products }) {
  const [editing, setEditing] = useState(null)

  const empty = {
    title: '',
    price: '',
    originalPrice: '',
    category: '',
    description: '',
    imageUrl: '',
    media: [],
    stock: '',
    rating: '',
    salesCount: '',
    isFeatured: false
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setEditing(empty)}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + เพิ่มสินค้า
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <img src={p.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-slate-700">{p.title}</p>
              <p className="mt-1 font-bold text-brand">{baht(p.price)}</p>
              <p className="text-xs text-slate-400">
                {p.category} · คงเหลือ {p.stock}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => {
                    if (confirm(`ลบสินค้า "${p.title}" ?`)) deleteProduct(p.id)
                  }}
                  className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <ProductEditor product={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ProductEditor({ product, onClose }) {
  const [form, setForm] = useState(() => ({ ...product, media: productMedia(product) }))
  const [saving, setSaving] = useState(false)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  const media = form.media || []
  function setMedia(next) {
    setForm((f) => ({ ...f, media: next }))
  }
  function addMedia(type) {
    setMedia([...media, { type, url: '', caption: '' }])
  }
  function updateMedia(i, patch) {
    setMedia(media.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  }
  function removeMedia(i) {
    setMedia(media.filter((_, idx) => idx !== i))
  }
  function moveMedia(i, dir) {
    const j = i + dir
    if (j < 0 || j >= media.length) return
    const next = [...media]
    ;[next[i], next[j]] = [next[j], next[i]]
    setMedia(next)
  }

  async function save() {
    setSaving(true)
    try {
      await upsertProduct(form)
      onClose()
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{form.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
        <div className="mt-4 space-y-3">
          <Input label="ชื่อสินค้า" value={form.title} onChange={(v) => set('title', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ราคา" type="number" value={form.price} onChange={(v) => set('price', v)} />
            <Input
              label="ราคาเดิม"
              type="number"
              value={form.originalPrice}
              onChange={(v) => set('originalPrice', v)}
            />
          </div>
          <Input label="หมวดหมู่" value={form.category} onChange={(v) => set('category', v)} />

          {/* Media gallery editor: images + videos with captions */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">รูปภาพ / วิดีโอ (แคตตาล็อกสื่อ)</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => addMedia('image')}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  + ภาพ
                </button>
                <button
                  type="button"
                  onClick={() => addMedia('video')}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  + วิดีโอ
                </button>
              </div>
            </div>

            {media.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-400">
                ยังไม่มีสื่อ — กด “+ ภาพ” หรือ “+ วิดีโอ” เพื่อเพิ่มลิงก์ (ภาพแรกจะเป็นรูปหลัก)
              </p>
            )}

            <div className="space-y-2">
              {media.map((m, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-xs ring-1 ring-slate-200">
                      {i === 0 ? '★' : i + 1}
                    </span>
                    <select
                      value={m.type}
                      onChange={(e) => updateMedia(i, { type: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option value="image">ภาพ</option>
                      <option value="video">วิดีโอ</option>
                    </select>
                    <input
                      value={m.url}
                      onChange={(e) => updateMedia(i, { url: e.target.value })}
                      placeholder={m.type === 'video' ? 'ลิงก์ YouTube หรือ .mp4' : 'ลิงก์รูปภาพ (URL)'}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => moveMedia(i, -1)}
                      disabled={i === 0}
                      className="px-1 text-slate-400 disabled:opacity-30"
                      aria-label="เลื่อนขึ้น"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMedia(i, 1)}
                      disabled={i === media.length - 1}
                      className="px-1 text-slate-400 disabled:opacity-30"
                      aria-label="เลื่อนลง"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="px-1 text-red-400 hover:text-red-600"
                      aria-label="ลบสื่อ"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    value={m.caption}
                    onChange={(e) => updateMedia(i, { caption: e.target.value })}
                    placeholder="คำบรรยายภาพ (ไม่บังคับ)"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="สต็อก" type="number" value={form.stock} onChange={(v) => set('stock', v)} />
            <Input label="เรตติ้ง" type="number" value={form.rating} onChange={(v) => set('rating', v)} />
            <Input label="ยอดขาย" type="number" value={form.salesCount} onChange={(v) => set('salesCount', v)} />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">รายละเอียด</span>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="input"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={!!form.isFeatured}
              onChange={(e) => set('isFeatured', e.target.checked)}
            />
            สินค้าแนะนำ
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 py-2.5 font-medium">
            ยกเลิก
          </button>
          <button
            onClick={save}
            disabled={saving || !form.title}
            className="flex-1 rounded-2xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  )
}
