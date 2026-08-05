import { Link } from 'react-router-dom'

// หน้าเข้าสู่ระบบสำหรับ "ลูกค้า" (ระบบสมาชิก) — จองพื้นที่ namespace /account/*
// แยกออกจากโซนผู้ดูแลระบบ (/admin/*) อย่างชัดเจน กันสับสนในอนาคต
export default function AccountLogin() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-bold text-white">
            S
          </span>
          <h1 className="mt-3 text-xl font-extrabold">เข้าสู่ระบบสมาชิก</h1>
          <p className="mt-1 text-sm text-slate-400">สำหรับลูกค้า ShopHub</p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">ระบบสมาชิกลูกค้า — เร็วๆ นี้</p>
          <p className="mt-1 text-xs text-slate-400">
            ตอนนี้สั่งซื้อได้เลยโดยไม่ต้องสมัครสมาชิก (guest checkout)
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 block w-full rounded-2xl bg-brand py-3 text-center font-semibold text-white transition hover:bg-brand-dark"
        >
          เลือกซื้อสินค้าต่อ
        </Link>

        <Link to="/" className="mt-3 block text-center text-sm text-slate-400 hover:text-brand">
          ← กลับหน้าร้าน
        </Link>
      </div>
    </div>
  )
}
