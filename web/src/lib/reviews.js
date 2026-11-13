import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'

export function subscribeApprovedReviews(productId, onData) {
  const q = query(
    collection(db, 'reviews'),
    where('productId', '==', String(productId)),
    where('approved', '==', true)
  )
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.approved === true)
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      onData(list)
    },
    (err) => {
      console.warn('[reviews] listener error:', err?.message)
      onData([])
    }
  )
}

export function subscribeAllReviews(onData) {
  return onSnapshot(
    collection(db, 'reviews'),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      onData(list)
    },
    (err) => {
      console.warn('[reviews] admin listener error:', err?.message)
      onData([])
    }
  )
}

export async function createReview({ productId, orderCode, name, rating, text, photos }) {
  const safePhotos = (photos || []).slice(0, 3).map((u) => String(u)).filter(Boolean)
  await addDoc(collection(db, 'reviews'), {
    productId: String(productId),
    orderCode: String(orderCode || '').trim().toUpperCase(),
    name: String(name || '').trim().slice(0, 80),
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    text: String(text || '').trim().slice(0, 1000),
    photos: safePhotos,
    approved: false,
    createdAt: Date.now()
  })
}

export async function setReviewApproved(id, approved) {
  await updateDoc(doc(db, 'reviews', id), { approved: !!approved, updatedAt: Date.now() })
}

export async function deleteReview(id) {
  await deleteDoc(doc(db, 'reviews', id))
}

export function reviewStats(reviews) {
  if (!reviews.length) return { avg: 0, count: 0 }
  const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0)
  return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length }
}

// Compress an uploaded photo to a small base64 JPEG (≤160KB target) so a
// review with up to 3 photos stays well under the 1MB Firestore doc limit.
export function compressPhoto(file, { maxSide = 900, targetKb = 150 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

      let quality = 0.72
      let data = canvas.toDataURL('image/jpeg', quality)
      while (data.length / 1024 > targetKb && quality > 0.3) {
        quality -= 0.1
        data = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(data)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('อ่านรูปไม่สำเร็จ'))
    }
    img.src = url
  })
}
