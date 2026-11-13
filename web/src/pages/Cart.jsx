import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { baht } from '../lib/format'
import { subscribeProducts } from '../lib/shop'

const FREE_SHIP_MIN = 1000
const SHIPPING_FEE = 40

export default function Cart() {
  const { items, setQty, remove, subtotal, add } = useCart()
  const toast = useToast()
  const [products, setProducts] = useState([])

  useEffect(() => subscribeProducts(setProducts), [])

  const shipping = subtotal > 0 && subtotal < FREE_SHIP_MIN ? SHIPPING_FEE : 0
  const total = subtotal + shipping
  const remain = Math.max(0, FREE_SHIP_MIN - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIP_MIN) * 100)

  const suggests = useMemo(() => {
    const inCart = new Set(items.map((it) => String(it.id ?? it.productId)))
    return [...products]
      .filter((p) => !inCart.has(String(p.id)) && Number(p.stock) > 0)
      .sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0))
      .slice(0, 2)
  }, [products, items])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight">ตะกร้าสินค้า</h1>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-ink-400">ยังไม่มีสินค้าในตะกร้า</p>
            <Link to="/" className="btn-primary mt-4 inline-block px-6 py-3">
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="mt-4 card-surface p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-600">
                  {remain > 0 ? (
                    <>ซื้ออีก <span className="font-extrabold text-brand">{baht(remain)}</span> รับส่งฟรี</>
                  ) : (
                    <span className="font-semibold text-green-600">✓ คุณได้รับสิทธิ์ส่งฟรีแล้ว</span>
                  )}
                </span>
                <span className="text-ink-400">{baht(Math.min(subtotal, FREE_SHIP_MIN))} / {baht(FREE_SHIP_MIN)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 card-surface p-3">
                  <img src={it.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-ink-700">{it.title}</p>
                    <p className="mt-1 font-bold text-brand">{baht(it.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg ring-1 ring-ink-200">
                        <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-2.5 py-1" aria-label="ลด">
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                        <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-2.5 py-1" aria-label="เพิ่ม">
                          +
                        </button>
                      </div>
                      <button onClick={() => remove(it.id)} className="text-sm text-ink-400 hover:text-red-500">
                        ลบ
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-bold text-ink-700">{baht(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 card-surface p-4">
              <div className="flex justify-between text-sm text-ink-500">
                <span>ยอดรวมสินค้า</span>
                <span>{baht(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-ink-500">
                <span>ค่าจัดส่ง</span>
                <span>{shipping === 0 ? 'ฟรี' : baht(shipping)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-ink-100 pt-3 text-lg font-extrabold">
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

            {/* Cross-sell */}
            {suggests.length > 0 && (
              <section className="mt-8">
                <p className="eyebrow">แนะนำเพิ่ม</p>
                <h2 className="section-title mt-1 text-lg">ซื้อคู่กันคุ้มกว่า</h2>
                <div className="mt-3 space-y-2">
                  {suggests.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 card-surface p-2.5">
                      <Link to={`/product/${p.id}`} className="shrink-0">
                        <img src={p.imageUrl} alt={p.title} className="h-14 w-14 rounded-lg object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium text-ink-700 hover:underline">
                          {p.title}
                        </Link>
                        <p className="text-sm font-bold text-brand">{baht(p.price)}</p>
                      </div>
                      <button
                        onClick={() => {
                          add(p, 1)
                          toast.success(`เพิ่ม "${p.title}" ลงตะกร้าแล้ว`)
                        }}
                        className="shrink-0 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-brand"
                      >
                        + ใส่ตะกร้า
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
