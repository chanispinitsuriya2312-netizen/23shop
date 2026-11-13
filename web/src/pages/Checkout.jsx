import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { baht } from '../lib/format'
import { createOrder } from '../lib/shop'
import { subscribeCampaign, applyPromo, isCampaignLive } from '../lib/campaign'
import { validateCoupon, incrementCouponUsage } from '../lib/coupons'
import { subscribeSettings, defaultSettings } from '../lib/settings'
import { trackEvent } from '../lib/marketing'
import { subscribePayment, defaultPayment } from '../lib/promptpay'
import PromptPayBox from '../components/PromptPayBox'

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    paymentMethod: 'เก็บเงินปลายทาง'
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')

  const [campaign, setCampaign] = useState(null)
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState({ ok: false, amount: 0, message: '' })
  const [payment, setPayment] = useState(defaultPayment)
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => subscribeCampaign(setCampaign), [])
  useEffect(() => subscribePayment(setPayment), [])
  useEffect(() => subscribeSettings(setSettings), [])

  useEffect(() => {
    if (!items.length) return
    trackEvent('InitiateCheckout', {
      currency: 'THB',
      value: subtotal,
      num_items: items.reduce((s, i) => s + i.quantity, 0)
    })
  }, [])

  const isPromptPay = form.paymentMethod.includes('PromptPay')

  async function handleApplyPromo() {
    const code = promoInput.trim()
    if (!code) return
    const byCampaign = applyPromo(code, subtotal, campaign, items)
    const res = byCampaign.ok ? byCampaign : await validateCoupon(code, subtotal)
    setPromo(res)
    if (res.ok) toast.success(res.message)
    else if (res.message) toast.error(res.message)
  }

  const discount = promo.ok ? promo.amount : 0
  const shipping =
    subtotal > 0 && subtotal - discount < Number(settings.freeShippingMin || 0)
      ? Number(settings.shippingFee || 0)
      : 0
  const total = Math.max(0, subtotal - discount + shipping)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.customerName || !form.customerPhone || !form.shippingAddress) {
      setError('กรุณากรอกชื่อ เบอร์โทร และที่อยู่จัดส่งให้ครบ')
      return
    }
    setSubmitting(true)
    try {
      const order = await createOrder({
        ...form,
        subtotal,
        shippingFee: shipping,
        discountAmount: discount,
        promoCode: promo.ok ? promoInput.trim().toUpperCase() : '',
        totalAmount: total,
        paymentStatus: isPromptPay ? 'unpaid' : 'cod',
        items: items.map((it) => ({
          productId: it.productId,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
          imageUrl: it.imageUrl
        }))
      })
      clear()
      if (promo.ok && promoInput.trim()) incrementCouponUsage(promoInput)
      trackEvent('Purchase', {
        currency: 'THB',
        value: total,
        transaction_id: order.orderCode,
        items: items.map((it) => ({
          item_id: String(it.productId ?? it.id),
          item_name: it.title,
          price: it.price,
          quantity: it.quantity
        }))
      })
      setDone(order)
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสั่งซื้อ: ' + (err?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">สั่งซื้อสำเร็จ!</h1>
          <p className="mt-2 text-slate-500">
            หมายเลขคำสั่งซื้อของคุณคือ
            <br />
            <span className="text-lg font-bold text-brand">{done.orderCode}</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">
            ยอดรวม {baht(done.totalAmount)} — ทางร้านจะอัปเดตสถานะให้ทราบเป็นระยะ
          </p>

          {done.paymentStatus !== 'cod' && payment?.promptPayId && (
            <PromptPayBox payment={payment} order={done} />
          )}

          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => navigate(`/track?code=${done.orderCode}`)}
              className="rounded-2xl border-2 border-brand px-5 py-3 font-semibold text-brand"
            >
              ติดตามพัสดุ
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-2xl bg-brand px-6 py-3 font-semibold text-white"
            >
              กลับหน้าร้าน
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-16 text-center text-slate-400">
          ไม่มีสินค้าในตะกร้า
          <div>
            <button onClick={() => navigate('/')} className="mt-4 text-brand">
              ← เลือกซื้อสินค้า
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-xl font-bold">ยืนยันคำสั่งซื้อ</h1>
        <form onSubmit={submit} className="mt-4 grid gap-6 md:grid-cols-5">
          <div className="space-y-3 md:col-span-3">
            <Field label="ชื่อ-นามสกุลผู้รับ">
              <input
                value={form.customerName}
                onChange={(e) => set('customerName', e.target.value)}
                className="input"
                placeholder="เช่น สมชาย ใจดี"
              />
            </Field>
            <Field label="เบอร์โทรศัพท์">
              <input
                value={form.customerPhone}
                onChange={(e) => set('customerPhone', e.target.value)}
                className="input"
                placeholder="08X-XXX-XXXX"
              />
            </Field>
            <Field label="ที่อยู่จัดส่ง">
              <textarea
                value={form.shippingAddress}
                onChange={(e) => set('shippingAddress', e.target.value)}
                rows={3}
                className="input"
                placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
              />
            </Field>
            <Field label="วิธีชำระเงิน">
              <select
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value)}
                className="input"
              >
                <option>เก็บเงินปลายทาง</option>
                <option>PromptPay QR (สแกนจ่าย + แนบสลิป)</option>
                <option>บัตรเครดิต/เดบิต</option>
              </select>
            </Field>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <h2 className="font-bold">สรุปคำสั่งซื้อ</h2>
              <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                {items.map((it) => (
                  <div key={it.id} className="flex justify-between gap-2 text-sm">
                    <span className="line-clamp-1 text-slate-600">
                      {it.title} × {it.quantity}
                    </span>
                    <span className="shrink-0 font-medium">{baht(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
              {isCampaignLive(campaign) && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <label className="text-xs font-medium text-slate-500">โค้ดส่วนลด</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder={campaign?.promoCode || 'ใส่โค้ด'}
                      className="input flex-1 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      ใช้โค้ด
                    </button>
                  </div>
                  {promo.ok && (
                    <p className="mt-1 text-xs font-medium text-green-600">✓ {promo.message}</p>
                  )}
                </div>
              )}
              <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า</span>
                  <span>{baht(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>ส่วนลด{promo.ok && promoInput ? ` (${promoInput.trim().toUpperCase()})` : ''}</span>
                    <span>-{baht(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ค่าจัดส่ง</span>
                  <span>{shipping === 0 ? 'ฟรี' : baht(shipping)}</span>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-lg font-extrabold">
                <span>รวมทั้งสิ้น</span>
                <span className="text-brand">{baht(total)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full rounded-2xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {submitting ? 'กำลังสั่งซื้อ...' : 'ยืนยันสั่งซื้อ'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}
