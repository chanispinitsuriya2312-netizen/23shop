import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { seedProducts } from '../data/seedProducts'

// ---------- Products ----------

export function subscribeProducts(onData, onError) {
  const col = collection(db, 'products')
  return onSnapshot(
    col,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Fall back to bundled seed catalog if the collection is empty.
      onData(items.length ? items : seedProducts.map((p) => ({ id: String(p.productId), ...p })))
    },
    (err) => {
      // Offline / rules / no-config: degrade gracefully to seed data.
      console.warn('[shop] products listener error, using seed data:', err?.message)
      onData(seedProducts.map((p) => ({ id: String(p.productId), ...p })))
      if (onError) onError(err)
    }
  )
}

export async function upsertProduct(product) {
  const id = product.id || String(product.productId || Date.now())
  const media = normalizeMedia(product.media, product.imageUrl)
  // Keep imageUrl as the primary/first image for backward compatibility.
  const primaryImage = media.find((m) => m.type === 'image')?.url || product.imageUrl || ''
  const payload = {
    productId: Number(product.productId) || Number(id) || Date.now(),
    title: product.title || '',
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || 0,
    category: product.category || '',
    description: product.description || '',
    imageUrl: primaryImage,
    media,
    stock: Number(product.stock) || 0,
    rating: Number(product.rating) || 0,
    salesCount: Number(product.salesCount) || 0,
    isFeatured: !!product.isFeatured,
    isAvailable: (Number(product.stock) || 0) > 0,
    sku: product.sku || `SKU-${id}`,
    updatedAt: Date.now(),
    createdAt: product.createdAt || Date.now()
  }
  await setDoc(doc(db, 'products', id), payload, { merge: true })
  return id
}

// ---------- Product media (images + videos with captions) ----------

// A media item is { type: 'image' | 'video', url, caption }.
// Falls back to the legacy single imageUrl so old products still render.
export function normalizeMedia(media, imageUrl) {
  const list = Array.isArray(media) ? media : []
  const cleaned = list
    .map((m) => ({
      type: m?.type === 'video' ? 'video' : 'image',
      url: String(m?.url || '').trim(),
      caption: String(m?.caption || '').trim()
    }))
    .filter((m) => m.url)
  if (cleaned.length) return cleaned
  const legacy = String(imageUrl || '').trim()
  return legacy ? [{ type: 'image', url: legacy, caption: '' }] : []
}

// Returns a normalized media list for display given a product document.
export function productMedia(product) {
  return normalizeMedia(product?.media, product?.imageUrl)
}

// Detects a YouTube URL and returns its embeddable form, else null.
export function youTubeEmbed(url) {
  const s = String(url || '')
  const m =
    s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/) || null
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id))
}

// ---------- Orders ----------

// Status pipeline shared with the Android app (English canonical values).
export const ORDER_STATUSES = ['Order Placed', 'Processing', 'Shipped', 'Delivered']

export function nextStatus(current) {
  const i = ORDER_STATUSES.indexOf(current)
  if (i === -1) return ORDER_STATUSES[1]
  return ORDER_STATUSES[Math.min(i + 1, ORDER_STATUSES.length - 1)]
}

export function subscribeOrders(onData, onError) {
  const col = collection(db, 'orders')
  let q
  try {
    q = query(col, orderBy('createdAt', 'desc'))
  } catch {
    q = col
  }
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.warn('[shop] orders listener error:', err?.message)
      onData([])
      if (onError) onError(err)
    }
  )
}

export async function createOrder(order) {
  const code = order.orderCode || genOrderCode()
  const payload = {
    orderCode: code,
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    shippingAddress: order.shippingAddress || '',
    paymentMethod: order.paymentMethod || 'เก็บเงินปลายทาง',
    subtotal: Number(order.subtotal) || 0,
    tax: Number(order.tax) || 0,
    shippingFee: Number(order.shippingFee) || 0,
    discountAmount: Number(order.discountAmount) || 0,
    promoCode: order.promoCode || '',
    totalAmount: Number(order.totalAmount) || 0,
    status: 'Order Placed',
    // Payment tracking: 'cod' for cash on delivery, otherwise 'unpaid' until a
    // slip is attached ('pending_review') and the admin confirms ('paid').
    paymentStatus: order.paymentStatus || 'unpaid',
    slipDataUrl: order.slipDataUrl || '',
    createdAt: Date.now(),
    source: 'web',
    items: (order.items || []).map((it) => ({
      productId: Number(it.productId) || 0,
      title: it.title || '',
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      imageUrl: it.imageUrl || ''
    }))
  }
  const ref = await addDoc(collection(db, 'orders'), payload)
  return { id: ref.id, ...payload }
}

export async function updateOrderStatus(id, status) {
  await updateDoc(doc(db, 'orders', id), { status, updatedAt: Date.now() })
}

// Attaches a compressed payment-slip image (base64 data URL) to an order and
// marks it as awaiting admin review. Stored inline in Firestore to stay ฿0
// (no Firebase Storage / Blaze plan required).
export async function attachOrderSlip(id, slipDataUrl) {
  await updateDoc(doc(db, 'orders', id), {
    slipDataUrl: slipDataUrl || '',
    paymentStatus: 'pending_review',
    updatedAt: Date.now()
  })
}

// Admin action: confirm or reject a submitted payment.
export async function setPaymentStatus(id, paymentStatus) {
  await updateDoc(doc(db, 'orders', id), { paymentStatus, updatedAt: Date.now() })
}

export function genOrderCode() {
  const n = Math.floor(10000 + Math.random() * 89999)
  return `SH-${n}`
}
