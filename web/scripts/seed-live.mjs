// Seeds the REAL Firebase project (shophub-3441a) with the ShopHub catalog,
// a sample order, and an admin account — via the client SDK (no CLI login needed).
//
// Requires: Firestore + Authentication (Email/Password) enabled, and security
// rules published that allow authenticated writes to /products and order create.
//
// Usage:  npm run seed:live
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { firebaseConfig } from '../src/firebaseConfig.js'
import { seedProducts } from '../src/data/seedProducts.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@shophub.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

async function seed() {
  console.log(`→ Target project: ${firebaseConfig.projectId}`)

  // Authenticate first — rules require auth for product writes.
  console.log('→ Creating / signing in admin account...')
  try {
    await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log(`   ✓ created ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  } catch (e) {
    if (String(e?.code).includes('email-already-in-use')) {
      console.log('   ℹ admin already exists, signing in')
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
    } else {
      throw e
    }
  }

  console.log('→ Seeding products...')
  for (const p of seedProducts) {
    const id = String(p.productId)
    await setDoc(doc(db, 'products', id), {
      ...p,
      sku: `SKU-${id}`,
      isAvailable: p.stock > 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    console.log('   ✓', p.title)
  }

  // Sample order (mirrors SH-98124 from the Android app) if none exist.
  const existing = await getDocs(collection(db, 'orders'))
  if (existing.empty) {
    console.log('→ Seeding sample order SH-98124...')
    await addDoc(collection(db, 'orders'), {
      orderCode: 'SH-98124',
      customerName: 'คุณสมชาย ใจดี',
      customerPhone: '081-234-5678',
      shippingAddress: '99/1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      paymentMethod: 'โอนเงินผ่าน PromptPay',
      subtotal: 2070,
      tax: 0,
      shippingFee: 0,
      discountAmount: 0,
      totalAmount: 2170,
      status: 'Shipped',
      createdAt: Date.now() - 86400000,
      source: 'seed',
      items: [
        {
          productId: 1,
          title: 'หูฟังบลูทูธไร้สาย เสียงระดับพรีเมียม ตัดเสียงรบกวน',
          price: 1290,
          quantity: 1,
          imageUrl: seedProducts[0].imageUrl
        },
        {
          productId: 5,
          title: 'แก้วน้ำเก็บอุณหภูมิ สแตนเลส 304',
          price: 390,
          quantity: 2,
          imageUrl: seedProducts[4].imageUrl
        }
      ]
    })
  }

  console.log('\n✅ Live seed complete.')
  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed failed:', e?.code || '', e?.message || e)
  process.exit(1)
})
