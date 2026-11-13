import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Admin-managed category list stored at config/categories. Storefront merges it
// with the seed catalog so new categories appear without editing code.
export function subscribeCategories(onData, onError) {
  return onSnapshot(
    doc(db, 'config', 'categories'),
    (snap) => onData(Array.isArray(snap.data()?.list) ? snap.data().list : []),
    (err) => {
      console.warn('[categories] listener error:', err?.message)
      onData([])
      if (onError) onError(err)
    }
  )
}

export async function saveCategories(list) {
  const clean = [...new Set((list || []).map((c) => String(c).trim()).filter(Boolean))]
  await setDoc(doc(db, 'config', 'categories'), { list: clean, updatedAt: Date.now() }, { merge: true })
  return clean
}
