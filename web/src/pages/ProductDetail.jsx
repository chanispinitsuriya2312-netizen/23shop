import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MediaGallery from '../components/MediaGallery'
import { subscribeProducts, productMedia } from '../lib/shop'
import { baht } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useSeo, seoConfig } from '../lib/seo'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [tab, setTab] = useState('detail')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const unsub = subscribeProducts(setProducts)
    return unsub
  }, [])

  const product = products.find((p) => String(p.id) === String(id))
  const media = useMemo(() => (product ? productMedia(product) : []), [product])

  const discount =
    product && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  // SEO: per-product title/description + JSON-LD Product structured data.
  useSeo(
    product
      ? {
          title: product.title,
          description: (product.description || '').slice(0, 155),
          canonical: `/product/${product.id}`,
          image: media[0]?.url || product.imageUrl,
          type: 'product',
          jsonLd: {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.title,
            image: media.filter((m) => m.type === 'image').map((m) => m.url),
            description: product.description,
            category: product.category,
            sku: product.sku || `SKU-${product.id}`,
            brand: { '@type': 'Brand', name: seoConfig.SITE_NAME },
            aggregateRating: product.rating
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: product.rating,
                  reviewCount: Math.max(1, Number(product.salesCount) || 1)
                }
              : undefined,
            offers: {
              '@type': 'Offer',
              url: `${seoConfig.SITE_URL}/product/${product.id}`,
              priceCurrency: 'THB',
              price: product.price,
              availability:
                (product.stock || 0) > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock'
            }
          }
        }
      : { title: 'สินค้า' }
  )

  if (products.length && !product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-slate-500">ไม่พบสินค้านี้</p>
          <Link to="/" className="mt-4 inline-block text-brand">
            ← กลับหน้าร้าน
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
            <div className="space-y-3">
              <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-24 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  function handleAdd(goCart) {
    add(product, qty)
    setAdded(true)
    if (goCart) {
      navigate('/checkout')
    } else {
      toast.success(`เพิ่ม "${product.title}" ลงตะกร้าแล้ว`)
    }
  }

  const maxQty = Math.max(1, Number(product.stock) || 1)
  const desc = product.description || ''
  const shortDesc = desc.length > 140 && !expanded ? desc.slice(0, 140) + '…' : desc

  return (
    <div className="min-h-screen bg-slate-50/40">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-400">
          <Link to="/" className="hover:text-brand">
            หน้าแรก
          </Link>
          <span>/</span>
          <Link to={`/?cat=${encodeURIComponent(product.category)}`} className="hover:text-brand">
            {product.category}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 text-slate-500">{product.title}</span>
        </nav>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Gallery */}
          <div className="md:sticky md:top-4 md:self-start">
            <MediaGallery media={media} title={product.title} />
          </div>

          {/* Info + buy panel */}
          <div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {product.category}
            </span>
            <h1 className="mt-3 text-xl font-bold text-slate-800 sm:text-2xl">{product.title}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1 text-amber-500">
                <StarIcon className="h-4 w-4" /> {product.rating}
              </span>
              <span>ขายแล้ว {product.salesCount}</span>
              <span className={product.stock > 0 ? 'text-slate-400' : 'text-red-500'}>
                {product.stock > 0 ? `คงเหลือ ${product.stock}` : 'สินค้าหมด'}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-brand">{baht(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-slate-400 line-through">{baht(product.originalPrice)}</span>
                  <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-sm font-bold text-brand">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Shipping / trust badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge icon="🚚" text="จัดส่งทั่วไทย" />
              <Badge icon="✅" text="สินค้าของแท้ 100%" />
              <Badge icon="↩️" text="คืนสินค้าได้ใน 7 วัน" />
            </div>

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-xl ring-1 ring-slate-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-lg"
                  aria-label="ลดจำนวน"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="px-3 py-2 text-lg disabled:opacity-40"
                  aria-label="เพิ่มจำนวน"
                >
                  +
                </button>
              </div>
              {added && <span className="text-sm font-medium text-green-600">เพิ่มลงตะกร้าแล้ว ✓</span>}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleAdd(false)}
                disabled={product.stock <= 0}
                className="flex-1 rounded-2xl border-2 border-brand py-3 font-semibold text-brand transition hover:bg-brand/5 disabled:opacity-50"
              >
                เพิ่มลงตะกร้า
              </button>
              <button
                onClick={() => handleAdd(true)}
                disabled={product.stock <= 0}
                className="flex-1 rounded-2xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                ซื้อเลย
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex gap-2 border-b border-slate-100">
                {[
                  ['detail', 'รายละเอียด'],
                  ['spec', 'ข้อมูลสินค้า'],
                  ['review', 'รีวิว']
                ].map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                      tab === k
                        ? 'border-brand text-brand'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="py-4 text-sm leading-relaxed text-slate-600">
                {tab === 'detail' && (
                  <div>
                    <p className="whitespace-pre-line">{shortDesc}</p>
                    {desc.length > 140 && (
                      <button
                        onClick={() => setExpanded((e) => !e)}
                        className="mt-2 font-medium text-brand"
                      >
                        {expanded ? 'ย่อ' : 'ดูเพิ่มเติม'}
                      </button>
                    )}
                  </div>
                )}
                {tab === 'spec' && (
                  <dl className="divide-y divide-slate-100">
                    <SpecRow label="หมวดหมู่" value={product.category} />
                    <SpecRow label="รหัสสินค้า (SKU)" value={product.sku || `SKU-${product.id}`} />
                    <SpecRow label="คงเหลือ" value={`${product.stock} ชิ้น`} />
                    <SpecRow label="คะแนน" value={`⭐ ${product.rating}`} />
                    <SpecRow label="ยอดขาย" value={`${product.salesCount} ชิ้น`} />
                  </dl>
                )}
                {tab === 'review' && (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center">
                    <p className="text-2xl font-extrabold text-slate-800">⭐ {product.rating}</p>
                    <p className="mt-1 text-slate-500">
                      จากผู้ซื้อจริง {product.salesCount} ราย — ระบบรีวิวพร้อมรูป/วิดีโอ เร็วๆ นี้
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Badge({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
      <span>{icon}</span>
      {text}
    </span>
  )
}

function SpecRow({ label, value }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  )
}

function StarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
    </svg>
  )
}
