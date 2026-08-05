import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// ---------- Discount campaign / flash sale ----------
//
// A campaign is stored in Firestore at config/campaign so the admin can edit it
// from the dashboard. A bundled default keeps the popup working even before any
// config exists (฿0, no backend required).

const DAY = 24 * 60 * 60 * 1000

export const defaultCampaign = {
  id: 'launch-sale',
  active: true,
  title: 'ฉลองเปิดร้าน ⚡ Flash Sale',
  subtitle: 'ลดสูงสุดทั้งร้าน ใช้โค้ดส่วนลดที่ช่องชำระเงิน',
  promoCode: 'SHOPHUB10',
  // scope: 'cart' = ลดทั้งตะกร้า | 'products' = ลดเฉพาะสินค้าที่เลือก (ลดเป็นชิ้น/เลหลัง)
  scope: 'cart',
  // discountType: 'percent' = ลด % | 'amount' = ลดเป็นจำนวนเงินต่อชิ้น
  discountType: 'percent',
  discountPercent: 10,
  discountAmountPerItem: 0,
  productIds: [],
  minSpend: 0,
  maxDiscount: 500,
  // Ends 3 days from first load by default; admin can set an absolute time.
  endsAt: Date.now() + 3 * DAY,
  ctaText: 'ช้อปเลย',
  accent: '#4f46e5'
}

export function subscribeCampaign(onData, onError) {
  const ref = doc(db, 'config', 'campaign')
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData({ ...defaultCampaign, ...snap.data() })
      } else {
        onData(defaultCampaign)
      }
    },
    (err) => {
      console.warn('[campaign] listener error, using default:', err?.message)
      onData(defaultCampaign)
      if (onError) onError(err)
    }
  )
}

export async function saveCampaign(campaign) {
  const payload = {
    id: campaign.id || 'campaign',
    active: !!campaign.active,
    title: campaign.title || '',
    subtitle: campaign.subtitle || '',
    promoCode: (campaign.promoCode || '').toUpperCase().trim(),
    scope: campaign.scope === 'products' ? 'products' : 'cart',
    discountType: campaign.discountType === 'amount' ? 'amount' : 'percent',
    discountPercent: Number(campaign.discountPercent) || 0,
    discountAmountPerItem: Number(campaign.discountAmountPerItem) || 0,
    productIds: Array.isArray(campaign.productIds)
      ? campaign.productIds.map((x) => Number(x)).filter((x) => !Number.isNaN(x))
      : [],
    minSpend: Number(campaign.minSpend) || 0,
    maxDiscount: Number(campaign.maxDiscount) || 0,
    endsAt: Number(campaign.endsAt) || Date.now() + 3 * DAY,
    ctaText: campaign.ctaText || 'ช้อปเลย',
    accent: campaign.accent || '#4f46e5',
    updatedAt: Date.now()
  }
  await setDoc(doc(db, 'config', 'campaign'), payload, { merge: true })
  return payload
}

// Whether the campaign offers any discount value (percent or fixed amount).
function hasDiscountValue(c) {
  if ((c.discountType || 'percent') === 'amount') {
    return Number(c.discountAmountPerItem) > 0
  }
  return Number(c.discountPercent) > 0
}

// Whether a campaign is currently valid (active + not expired + has value).
export function isCampaignLive(c) {
  return !!c && c.active && Number(c.endsAt) > Date.now() && hasDiscountValue(c)
}

// Is a product part of this (product-scoped) campaign?
export function isProductInCampaign(campaign, productId) {
  const c = campaign || defaultCampaign
  if (!isCampaignLive(c) || c.scope !== 'products') return false
  return (c.productIds || []).map(String).includes(String(productId))
}

// Discount for a single line item under a product-scoped campaign (0 if n/a).
export function lineDiscount(campaign, item) {
  const c = campaign || defaultCampaign
  if (!isProductInCampaign(c, item.productId ?? item.id)) return 0
  const line = Number(item.price) * Number(item.quantity)
  if ((c.discountType || 'percent') === 'amount') {
    return Math.min(Number(c.discountAmountPerItem) * Number(item.quantity), line)
  }
  return Math.round((line * Number(c.discountPercent)) / 100)
}

/**
 * Validates a promo code against a campaign and computes the discount amount.
 * - scope 'cart': percentage off the whole subtotal.
 * - scope 'products': per-piece / clearance discount on eligible items only
 *   (requires the cart `items` array). Returns { ok, amount, message }.
 */
export function applyPromo(code, subtotal, campaign, items = []) {
  const c = campaign || defaultCampaign
  const input = String(code || '').toUpperCase().trim()
  if (!input) return { ok: false, amount: 0, message: '' }
  if (!isCampaignLive(c)) return { ok: false, amount: 0, message: 'แคมเปญนี้สิ้นสุดแล้ว' }
  if (input !== String(c.promoCode || '').toUpperCase()) {
    return { ok: false, amount: 0, message: 'โค้ดส่วนลดไม่ถูกต้อง' }
  }
  if (subtotal < Number(c.minSpend || 0)) {
    return {
      ok: false,
      amount: 0,
      message: `ยอดขั้นต่ำ ${Number(c.minSpend).toLocaleString('th-TH')} บาท`
    }
  }

  let amount = 0
  if ((c.scope || 'cart') === 'products') {
    const eligible = (items || []).filter((it) =>
      (c.productIds || []).map(String).includes(String(it.productId ?? it.id))
    )
    if (eligible.length === 0) {
      return { ok: false, amount: 0, message: 'ไม่มีสินค้าร่วมรายการในตะกร้า' }
    }
    amount = eligible.reduce((s, it) => s + lineDiscount(c, it), 0)
    if (c.maxDiscount > 0) amount = Math.min(amount, Number(c.maxDiscount))
    return {
      ok: true,
      amount,
      message: `ใช้โค้ด ${input} ลด ${amount.toLocaleString('th-TH')} บาท (เฉพาะสินค้าร่วมรายการ)`
    }
  }

  amount = Math.round((subtotal * Number(c.discountPercent)) / 100)
  if (c.maxDiscount > 0) amount = Math.min(amount, Number(c.maxDiscount))
  return { ok: true, amount, message: `ใช้โค้ด ${input} ลด ${amount.toLocaleString('th-TH')} บาท` }
}

// Breaks a remaining-milliseconds value into d/h/m/s parts for a countdown.
export function countdownParts(ms) {
  const clamped = Math.max(0, ms)
  return {
    days: Math.floor(clamped / DAY),
    hours: Math.floor((clamped % DAY) / (60 * 60 * 1000)),
    minutes: Math.floor((clamped % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((clamped % (60 * 1000)) / 1000),
    done: clamped <= 0
  }
}
