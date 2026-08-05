import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../context/CartContext'
import { baht } from '../lib/format'

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart()
  const shipping = subtotal > 0 && subtotal < 1000 ? 40 : 0
  const total = subtotal + shipping

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-bold">ตะกร้าสินค้า</h1>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-slate-400">ยังไม่มีสินค้าในตะกร้า</p>
            <Link to="/" className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white">
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <img src={it.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-slate-700">{it.title}</p>
                    <p className="mt-1 font-bold text-brand">{baht(it.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg ring-1 ring-slate-200">
                        <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-2.5 py-1">
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                        <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-2.5 py-1">
                          +
                        </button>
                      </div>
                      <button onClick={() => remove(it.id)} className="text-sm text-slate-400 hover:text-red-500">
                        ลบ
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-bold text-slate-700">{baht(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <div className="flex justify-between text-sm text-slate-500">
                <span>ยอดรวมสินค้า</span>
                <span>{baht(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-slate-500">
                <span>ค่าจัดส่ง</span>
                <span>{shipping === 0 ? 'ฟรี' : baht(shipping)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-lg font-extrabold">
                <span>รวมทั้งสิ้น</span>
                <span className="text-brand">{baht(total)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-4 block rounded-2xl bg-brand py-3 text-center font-semibold text-white transition hover:bg-brand-dark"
              >
                ดำเนินการสั่งซื้อ
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
