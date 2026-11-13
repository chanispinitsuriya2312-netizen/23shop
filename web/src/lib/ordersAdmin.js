import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export const PAYMENT_LABELS = {
  paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-700' },
  pending_review: { label: 'รอตรวจสลิป', color: 'bg-amber-100 text-amber-700' },
  unpaid: { label: 'ยังไม่ชำระ', color: 'bg-red-100 text-red-600' },
  cod: { label: 'เก็บปลายทาง', color: 'bg-slate-100 text-slate-500' }
}

export function paymentLabel(status) {
  return PAYMENT_LABELS[status] || PAYMENT_LABELS.unpaid
}

// Admin-only order update. Always records statusHistory on status change and
// mirrors a PII-free copy to tracking/{orderCode} for the public /track page.
export async function updateOrderAdmin(id, patch) {
  const ref = doc(db, 'orders', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('ไม่พบออเดอร์นี้')
  const data = snap.data()
  const now = Date.now()
  const update = { ...patch, updatedAt: now }

  if (patch.status && patch.status !== data.status) {
    update.statusHistory = [...(data.statusHistory || []), { status: patch.status, at: now }]
  }

  await updateDoc(ref, update)

  const merged = { ...data, ...update }
  if (merged.orderCode) {
    try {
      await setDoc(
        doc(db, 'tracking', merged.orderCode),
        {
          orderCode: merged.orderCode,
          status: merged.status,
          statusHistory: merged.statusHistory || [],
          courier: merged.courier || '',
          trackingNumber: merged.trackingNumber || '',
          itemsCount: (merged.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0),
          updatedAt: now
        },
        { merge: true }
      )
    } catch (e) {
      console.warn('[ordersAdmin] tracking mirror skipped:', e?.message)
    }
  }
  return merged
}
