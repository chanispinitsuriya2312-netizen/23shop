# ShopHub Web

เว็บไซต์ ShopHub (React + Vite + Tailwind + Firebase) — หน้าร้านลูกค้า + แดชบอร์ดแอดมิน
ใช้ Cloud Firestore เป็นฐานข้อมูลกลางร่วมกับแอป Android

## โครงสร้าง
- `src/pages/Storefront.jsx` — หน้าร้าน (list/ค้นหา/กรองหมวดหมู่)
- `src/pages/ProductDetail.jsx` — รายละเอียดสินค้า
- `src/pages/Cart.jsx`, `Checkout.jsx` — ตะกร้า + สั่งซื้อ (เขียน `orders`)
- `src/pages/AdminLogin.jsx` — เข้าสู่ระบบแอดมิน (Firebase Auth)
- `src/pages/AdminDashboard.jsx` — จัดการสินค้า (CRUD) + ออเดอร์ + เปลี่ยนสถานะ
- `src/lib/shop.js` — data access (Firestore) + realtime listeners
- `src/firebase.js` / `src/firebaseConfig.js` — การตั้งค่า Firebase

## รันแบบ Local (Emulator — ไม่ต้อง login Firebase)
```bash
npm install
# เทอร์มินัล 1: สตาร์ท emulator (ต้องมี Java)
npm run emu
# เทอร์มินัล 2: seed ข้อมูลตัวอย่าง + บัญชีแอดมิน
npm run seed
# เทอร์มินัล 3: สตาร์ทเว็บ (โหมด emulator อัตโนมัติ)
npm run dev
```
เปิด http://localhost:5173 — แอดมิน: `admin@shophub.com` / `123456`
Emulator UI: http://localhost:4000

## Deploy จริง (หลังตั้งค่าโปรเจกต์ Firebase)
1. `firebase apps:create WEB shophub-web` → `firebase apps:sdkconfig WEB <appId>`
2. เอา config ใส่ใน `src/firebaseConfig.js`
3. เปิด Authentication → Email/Password + สร้างบัญชีแอดมิน
4. `npm run build && firebase deploy --only hosting,firestore:rules`
