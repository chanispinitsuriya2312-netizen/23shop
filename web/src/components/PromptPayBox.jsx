import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { promptPayPayload } from '../lib/promptpay'
import { attachOrderSlip } from '../lib/shop'
import { baht } from '../lib/format'
import { useToast } from '../context/ToastContext'

// Compresses an image File into a small JPEG data URL so a payment slip can be
// stored inline in Firestore (well under the 1MB document limit) without paying
// for Firebase Storage.
function compressImage(file, maxSize = 900, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PromptPayBox({ payment, order }) {
  const toast = useToast()
  const [qr, setQr] = useState('')
  const [slip, setSlip] = useState('')
  const [saving, setSaving] = useState(false)
  const [attached, setAttached] = useState(false)
  const fileRef = useRef(null)

  const amount = Number(order?.totalAmount) || 0
  const payloadStr = useMemo(
    () => promptPayPayload(payment?.promptPayId, amount),
    [payment?.promptPayId, amount]
  )

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(payloadStr, { width: 320, margin: 1 })
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(''))
    return () => {
      alive = false
    }
  }, [payloadStr])

  async function pickSlip(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      setSlip(dataUrl)
    } catch {
      toast.error('อ่านไฟล์รูปไม่สำเร็จ ลองใหม่อีกครั้ง')
    }
  }

  async function submitSlip() {
    if (!slip || !order?.id) return
    setSaving(true)
    try {
      await attachOrderSlip(order.id, slip)
      setAttached(true)
      toast.success('ส่งสลิปเรียบร้อย ทางร้านจะตรวจสอบและยืนยันการชำระเงิน')
    } catch (err) {
      toast.error('ส่งสลิปไม่สำเร็จ: ' + (err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-white p-5 text-left ring-1 ring-slate-100">
      <h2 className="text-center font-bold text-slate-800">ชำระเงินด้วย PromptPay</h2>
      <p className="mt-1 text-center text-sm text-slate-500">
        {payment?.merchantName || 'ShopHub'}
      </p>

      <div className="mt-4 grid place-items-center rounded-2xl bg-gradient-to-b from-sky-50 to-white p-4">
        {qr ? (
          <img src={qr} alt="PromptPay QR" className="h-56 w-56" />
        ) : (
          <div className="grid h-56 w-56 place-items-center text-slate-300">กำลังสร้าง QR...</div>
        )}
        <p className="mt-2 text-2xl font-extrabold text-brand">{baht(amount)}</p>
        <p className="text-xs text-slate-400">พร้อมเพย์: {payment?.promptPayId || '—'}</p>
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        {payment?.note || 'สแกน QR เพื่อโอน แล้วแนบสลิปเพื่อยืนยันการชำระเงิน'}
      </p>

      {attached ? (
        <div className="mt-4 rounded-xl bg-green-50 p-3 text-center text-sm font-medium text-green-700">
          ✓ ได้รับสลิปแล้ว รอทางร้านยืนยัน
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickSlip}
            className="hidden"
          />
          {slip ? (
            <div className="space-y-2">
              <img
                src={slip}
                alt="สลิปการโอน"
                className="mx-auto max-h-56 rounded-xl ring-1 ring-slate-200"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-500"
              >
                เลือกรูปใหม่
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-brand hover:text-brand"
            >
              📎 แนบสลิปการโอนเงิน
            </button>
          )}
          <button
            onClick={submitSlip}
            disabled={!slip || saving}
            className="w-full rounded-2xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {saving ? 'กำลังส่ง...' : 'ยืนยันการชำระเงิน'}
          </button>
        </div>
      )}
    </div>
  )
}
