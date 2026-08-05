// Seeds the Firebase Emulator (or a real project) with the ShopHub catalog,
// a sample order, and an admin account.
//
// Usage (emulator, no login required):
//   1) In one terminal:  npm run emu       (starts emulators)
//   2) In another:        npm run seed
//
// Env:
//   FIRESTORE_EMULATOR_HOST=localhost:8080  (default set below)
//   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs
} from 'firebase/firestore'
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { seedProducts } from '../src/data/seedProducts.js'

const HOST = process.env.VITE_EMULATOR_HOST || 'localhost'
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-shophub'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@shophub.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456'

const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-api-key' })
const db = getFirestore(app)
const auth = getAuth(app)

connectFirestoreEmulator(db, HOST, 8080)
connectAuthEmulator(auth, `http://${HOST}:9099`, { disableWarnings: true })

async function seed() {
  // Authenticate first — Firestore rules require auth for product/order writes.
  console.log('→ Creating admin account...')
  try {
    await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log(`   ✓ ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  } catch (e) {
    if (String(e?.code).includes('email-already-in-use')) {
      console.log('   ℹ admin already exists, signing in')
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
    } else {
      console.warn('   ! could not create admin:', e?.message)
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

  console.log('\n✅ Seed complete.')
  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
