import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// ---------- Storefront display settings ----------
//
// General storefront display options live at config/store so the admin can
// toggle them from the dashboard. A bundled default keeps the storefront
// working before any config exists (฿0, no backend required).

export const defaultSettings = {
  // Store profile (shown in Navbar/Footer/Info pages)
  storeName: 'ShopHub',
  phone: '081-234-5678',
  lineId: '@shophub',
  facebook: 'https://facebook.com/shophub',
  instagram: 'https://instagram.com/shophub',
  announcement: 'ส่งฟรีเมื่อซื้อครบ ฿1,000 · จัดส่งทั่วไทย 1–3 วันทำการ',
  // Delivery
  shippingFee: 40,
  freeShippingMin: 1000,
  codEnabled: true,
  // Show the remaining stock (คงเหลือ) on product cards in the storefront grid.
  showStockOnCard: true,
  // Analytics IDs (loaded only when set — Spark-safe)
  ga4Id: '',
  metaPixelId: '',
  tiktokPixelId: ''
}

export function subscribeSettings(onData, onError) {
  const ref = doc(db, 'config', 'store')
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) onData({ ...defaultSettings, ...snap.data() })
      else onData(defaultSettings)
    },
    (err) => {
      console.warn('[settings] listener error, using default:', err?.message)
      onData(defaultSettings)
      if (onError) onError(err)
    }
  )
}

export async function saveSettings(cfg) {
  const payload = {
    ...Object.fromEntries(
      Object.keys(defaultSettings)
        .filter((k) => cfg[k] !== undefined)
        .map((k) => [k, cfg[k]])
    ),
    updatedAt: Date.now()
  }
  await setDoc(doc(db, 'config', 'store'), payload, { merge: true })
  return payload
}
