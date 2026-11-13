import { Link } from 'react-router-dom'

const POLICIES = [
  ['นโยบายการจัดส่ง', '/policy/shipping'],
  ['นโยบายคืนสินค้า', '/policy/returns'],
  ['นโยบายความเป็นส่วนตัว', '/policy/privacy']
]

export default function Footer({ store }) {
  const name = store?.storeName || 'ShopHub'
  const phone = store?.phone || '081-234-5678'
  const lineId = store?.lineId || '@shophub'
  const facebook = store?.facebook || ''
  const instagram = store?.instagram || ''

  return (
    <footer className="mt-16 border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-sm font-bold text-white">
                S<span className="text-brand">.</span>
              </span>
              <span className="text-lg font-extrabold tracking-tight">{name}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              สินค้าคุณภาพคัดสรร ส่งไว ราคาดี — สั่งซื้อออนไลน์ได้ตลอด 24 ชั่วโมง
            </p>
            <div className="mt-4 flex gap-2">
              {facebook && (
                <a href={facebook} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 text-sm text-ink-600 transition hover:border-brand hover:text-brand" aria-label="Facebook">
                  f
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 text-sm text-ink-600 transition hover:border-brand hover:text-brand" aria-label="Instagram">
                  ig
                </a>
              )}
              <a href={`https://line.me/R/ti/p/${lineId.replace(/^@/, '%40')}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 text-xs text-ink-600 transition hover:border-brand hover:text-brand" aria-label="LINE">
                LN
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-900">เมนู</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/" className="hover:text-brand">หน้าแรก</Link></li>
              <li><Link to="/?cat=ทั้งหมด#products" className="hover:text-brand">สินค้าทั้งหมด</Link></li>
              <li><Link to="/#sale" className="hover:text-brand">โปรโมชัน</Link></li>
              <li><Link to="/track" className="hover:text-brand">ติดตามพัสดุ</Link></li>
              <li><Link to="/wishlist" className="hover:text-brand">สินค้าที่ถูกใจ</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-900">ช่วยเหลือ</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              {POLICIES.map(([label, to]) => (
                <li key={to}><Link to={to} className="hover:text-brand">{label}</Link></li>
              ))}
              <li><Link to="/about" className="hover:text-brand">เกี่ยวกับเรา</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-900">ติดต่อร้าน</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li>โทร {phone}</li>
              <li>LINE {lineId}</li>
              <li>ทุกวัน 09:00–21:00 น.</li>
            </ul>
            <Link to="/contact" className="mt-4 inline-flex text-sm font-semibold text-brand hover:underline">
              ส่งข้อความถึงร้าน →
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. สงวนลิขสิทธิ์</p>
          <p>ชำระเงินปลอดภัย · PromptPay · เก็บเงินปลายทาง</p>
        </div>
      </div>
    </footer>
  )
}
