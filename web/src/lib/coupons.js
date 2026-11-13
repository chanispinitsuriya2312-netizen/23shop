import { doc, getDoc, increment, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const codeId = (code) => String(code || '').trim().toUpperCase()

export async function validateCoupon(code, subtotal) {
  const id = codeId(code)
  if (!id) return { ok: false, message: '' }
  try {
    const snap = await getDoc(doc(db, 'coupons', id))
    if (!snap.exists()) return { ok: false, message: 'ไม่พบโค้ดส่วนลดนี้' }
    const c = snap.data()
    const now = Date.now()
    if (c.active === false) return { ok: false, message: 'โค้ดนี้ปิดใช้งานแล้ว' }
    if (c.startsAt && Number(c.startsAt) > now) return { ok: false, message: 'โค้ดนี้ยังไม่เริ่มใช้งาน' }
    if (c.endsAt && Number(c.endsAt) < now) return { ok: false, message: 'โค้ดนี้หมดอายุแล้ว' }
    if (Number(c.usageLimit) > 0 && Number(c.usedCount || 0) >= Number(c.usageLimit)) {
      return { ok: false, message: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว' }
    }
    if (Number(c.minSpend) > 0 && subtotal < Number(c.minSpend)) {
      return { ok: false, message: `ต้องซื้อขั้นต่ำ ฿${Number(c.minSpend).toLocaleString('th-TH')}` }
    }
    let amount =
      c.type === 'amount' ? Number(c.value) || 0 : Math.round((subtotal * (Number(c.value) || 0)) / 100)
    if (Number(c.maxDiscount) > 0) amount = Math.min(amount, Number(c.maxDiscount))
    amount = Math.max(0, Math.min(amount, subtotal))
    if (amount <= 0) return { ok: false, message: 'โค้ดนี้ไม่สามารถใช้กับยอดนี้ได้' }
    return { ok: true, code: id, amount, message: `ใช้โค้ด ${id} ลด ฿${amount.toLocaleString('th-TH')}` }
  } catch (e) {
    console.warn('[coupons] validate failed:', e?.message)
    return { ok: false, message: 'ตรวจสอบโค้ดไม่สำเร็จ กรุณาลองใหม่' }
  }
}

export async function incrementCouponUsage(code) {
  const id = codeId(code)
  if (!id) return
  try {
    await updateDoc(doc(db, 'coupons', id), { usedCount: increment(1), updatedAt: Date.now() })
  } catch (e) {
    console.warn('[coupons] usage increment skipped:', e?.message)
  }
}
