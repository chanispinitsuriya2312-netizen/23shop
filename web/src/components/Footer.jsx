import { Link } from 'react-router-dom'
import ChannelIcon from './ChannelIcon'

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
    <footer className="mx-auto mt-16 max-w-6xl px-3 pb-4">
      <div className="rounded-[2rem] border border-ink-100 bg-white px-5 py-8 shadow-soft sm:px-8 sm:py-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-panel text-sm font-bold text-white shadow-press">
                S<span className="text-brand">.</span>
              </span>
              <span className="text-lg font-extrabold tracking-tight">{name}</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-500 sm:text-sm">
              สินค้าคุณภาพคัดสรร ส่งไว ราคาดี — สั่งซื้อออนไลน์ได้ตลอด 24 ชั่วโมง
            </p>
            <div className="mt-4 flex gap-2">
              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full bg-ink-50 text-ink-500 ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:text-brand hover:ring-brand/30"
                  aria-label="Facebook"
                >
                  <ChannelIcon name="facebook" size={16} />
                </a>
              )}
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full bg-ink-50 text-ink-500 ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:text-brand hover:ring-brand/30"
                  aria-label="Instagram"
                >
                  <ChannelIcon name="instagram" size={16} />
                </a>
              )}
              <a
                href={`https://line.me/R/ti/p/${lineId.replace(/^@/, '%40')}`}
                target="_blank"
                rel="noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-ink-50 text-ink-500 ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:text-brand hover:ring-brand/30"
                aria-label="LINE"
              >
                <ChannelIcon name="line" size={16} />
              </a>
            </div>
          </div>

          {/* Menu */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">เมนู</p>
            <ul className="mt-3 space-y-2.5 text-[13px] text-ink-600 sm:text-sm">
              <li><Link to="/" className="transition hover:text-brand">หน้าแรก</Link></li>
              <li><Link to="/?cat=ทั้งหมด#products" className="transition hover:text-brand">สินค้าทั้งหมด</Link></li>
              <li><Link to="/#sale" className="transition hover:text-brand">โปรโมชัน</Link></li>
              <li><Link to="/track" className="transition hover:text-brand">ติดตามพัสดุ</Link></li>
              <li><Link to="/wishlist" className="transition hover:text-brand">สินค้าที่ถูกใจ</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">ช่วยเหลือ</p>
            <ul className="mt-3 space-y-2.5 text-[13px] text-ink-600 sm:text-sm">
              {POLICIES.map(([label, to]) => (
                <li key={to}><Link to={to} className="transition hover:text-brand">{label}</Link></li>
              ))}
              <li><Link to="/about" className="transition hover:text-brand">เกี่ยวกับเรา</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">ติดต่อร้าน</p>
            <ul className="mt-3 grid gap-2 text-[13px] text-ink-600 sm:grid-cols-3 sm:text-sm lg:grid-cols-1">
              <li className="inline-flex items-center gap-2">
                <span className="text-ink-400"><ChannelIcon name="phone" size={15} /></span>
                {phone}
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="text-ink-400"><ChannelIcon name="line" size={15} /></span>
                {lineId}
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="text-ink-400"><ChannelIcon name="globe" size={15} /></span>
                ทุกวัน 09:00–21:00 น.
              </li>
            </ul>
            <Link
              to="/contact"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand/10 px-4 text-[13px] font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              ส่งข้อความถึงร้าน →
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-1.5 border-t border-ink-100 pt-5 text-[11px] text-ink-400 sm:flex-row sm:justify-between sm:text-xs">
          <p>© {new Date().getFullYear()} {name}. สงวนลิขสิทธิ์</p>
          <p>ชำระเงินปลอดภัย · PromptPay · เก็บเงินปลายทาง</p>
        </div>
      </div>
    </footer>
  )
}
