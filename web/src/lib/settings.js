import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// ---------- Storefront display settings ----------
//
// General storefront display options live at config/store so the admin can
// toggle them from the dashboard. A bundled default keeps the storefront
// working before any config exists (฿0, no backend required).

export const defaultSettings = {
  // Show the remaining stock (คงเหลือ) on product cards in the storefront grid.
  showStockOnCard: true
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
    showStockOnCard: cfg.showStockOnCard !== false,
    updatedAt: Date.now()
  }
  await setDoc(doc(db, 'config', 'store'), payload, { merge: true })
  return payload
}
