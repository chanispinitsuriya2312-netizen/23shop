import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { baht } from '../lib/format'

const FREE_SHIP_MIN = 1000

export default function CartDrawer() {
  const { items, subtotal, count, setQty, remove, drawerOpen, closeDrawer } = useCart()
  const navigate = useNavigate()

  if (!drawerOpen) return null

  const shipping = subtotal > 0 && subtotal < FREE_SHIP_MIN ? 40 : 0

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeDrawer} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl animate-[drawerIn_.28s_ease-out]">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <p className="font-extrabold text-ink-900">ตะกร้าสินค้า {count > 0 && `(${count})`}</p>
          <button onClick={closeDrawer} className="grid h-9 w-9 place-items-center rounded-full text-ink-400 hover:bg-ink-100" aria-label="ปิด">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-ink-400">ยังไม่มีสินค้าในตะกร้า</p>
            <button
              onClick={() => {
                closeDrawer()
                navigate('/')
              }}
              className="btn-primary px-5 py-2.5"
            >
              เลือกซื้อสินค้า
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3">
                  <img src={it.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-ink-700">{it.title}</p>
                    <p className="text-sm font-bold text-brand">{baht(it.price)}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex items-center rounded-lg ring-1 ring-ink-200">
                        <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-2 py-0.5 text-sm">−</button>
                        <span className="w-7 text-center text-xs font-semibold">{it.quantity}</span>
                        <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-2 py-0.5 text-sm">+</button>
                      </div>
                      <button onClick={() => remove(it.id)} className="text-xs text-ink-400 hover:text-red-500">ลบ</button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-ink-700">{baht(it.price * it.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-100 px-4 py-4">
              <div className="flex justify-between text-sm text-ink-500">
                <span>ยอดสินค้า</span>
                <span>{baht(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-ink-500">
                <span>ค่าส่ง (ประเมิน)</span>
                <span>{shipping === 0 ? 'ฟรี' : baht(shipping)}</span>
              </div>
              <button
                onClick={() => {
                  closeDrawer()
                  navigate('/checkout')
                }}
                className="mt-3 w-full rounded-2xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark"
              >
                ไปชำระเงิน · {baht(subtotal + shipping)}
              </button>
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="mt-2 block text-center text-sm font-medium text-ink-500 hover:text-brand"
              >
                ดูตะกร้าทั้งหมด
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
