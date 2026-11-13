import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MediaGallery from '../components/MediaGallery'
import ProductCard from '../components/ProductCard'
import { subscribeProducts, productMedia } from '../lib/shop'
import { subscribeCampaign } from '../lib/campaign'
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
  const [campaign, setCampaign] = useState(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [tab, setTab] = useState('detail')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const unsub = subscribeProducts(setProducts)
    return unsub
  }, [])
  useEffect(() => subscribeCampaign(setCampaign), [])

  const product = products.find((p) => String(p.id) === String(id))
  const media = useMemo(() => (product ? productMedia(product) : []), [product])

  const discount =
    product && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  const related = useMemo(() => {
    if (!product) return []
    const ids = (product.relatedIds || []).map(String)
    const picked = products.filter(
      (p) => String(p.id) !== String(product.id) && ids.includes(String(p.id))
    )
    if (picked.length >= 4) return picked.slice(0, 4)
    const sameCat = products.filter(
      (p) => String(p.id) !== String(product.id) && p.category === product.category && !picked.includes(p)
    )
    return [...picked, ...sameCat].slice(0, 4)
  }, [products, product])

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
          <p className="text-ink-400">ไม่พบสินค้านี้</p>
          <Link to="/" className="mt-4 inline-block text-brand">
            ← กลับหน้าร้าน
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-3xl bg-ink-100" />
            <div className="space-y-3">
              <div className="h-6 w-2/3 animate-pulse rounded bg-ink-100" />
              <div className="h-10 w-1/2 animate-pulse rounded bg-ink-100" />
              <div className="h-24 animate-pulse rounded bg-ink-100" />
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

  const pageUrl = `${seoConfig.SITE_URL}/product/${product.id}`
  const shareText = encodeURIComponent(product.title)

  const maxQty = Math.max(1, Number(product.stock) || 1)
  const desc = product.description || ''
  const shortDesc = desc.length > 140 && !expanded ? desc.slice(0, 140) + '…' : desc
  const soldOut = Number(product.stock) <= 0

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-28 lg:pb-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-ink-400">
          <Link to="/" className="hover:text-brand">หน้าแรก</Link>
          <span>/</span>
          <Link to={`/?cat=${encodeURIComponent(product.category)}`} className="hover:text-brand">
            {product.category}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 text-ink-500">{product.title}</span>
        </nav>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Gallery */}
          <div className="md:sticky md:top-20 md:self-start">
            <MediaGallery media={media} title={product.title} />
          </div>

          {/* Info + buy panel */}
          <div>
            <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
              {product.category}
            </span>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{product.title}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-400">
              <span className="flex items-center gap-1 text-amber-500">
                <StarIcon className="h-4 w-4" /> {product.rating}
              </span>
              <span>ขายแล้ว {product.salesCount}</span>
              <span className={soldOut ? 'text-red-500' : 'text-ink-400'}>
                {soldOut ? 'สินค้าหมด' : `คงเหลือ ${product.stock}`}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-brand">{baht(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-ink-300 line-through">{baht(product.originalPrice)}</span>
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
              <div className="flex items-center rounded-xl ring-1 ring-ink-200">
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
                disabled={soldOut}
                className="flex-1 rounded-2xl border-2 border-brand py-3 font-semibold text-brand transition hover:bg-brand/5 disabled:opacity-50"
              >
                เพิ่มลงตะกร้า
              </button>
              <button
                onClick={() => handleAdd(true)}
                disabled={soldOut}
                className="flex-1 rounded-2xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              >
                ซื้อเลย
              </button>
            </div>

            {/* Share */}
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
              <span>แชร์:</span>
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}&text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#06c755]/10 px-2.5 py-1.5 font-semibold text-[#06a648] hover:bg-[#06c755]/20"
              >
                LINE
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#1877f2]/10 px-2.5 py-1.5 font-semibold text-[#1877f2] hover:bg-[#1877f2]/20"
              >
                Facebook
              </a>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pageUrl)
                    toast.success('คัดลอกลิงก์แล้ว')
                  } catch {
                    toast.error('คัดลอกไม่สำเร็จ')
                  }
                }}
                className="rounded-lg bg-ink-100 px-2.5 py-1.5 font-semibold text-ink-500 hover:bg-ink-200"
              >
                คัดลอกลิงก์
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex gap-2 border-b border-ink-100">
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
                        : 'border-transparent text-ink-400 hover:text-ink-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="py-4 text-sm leading-relaxed text-ink-600">
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
                  <dl className="divide-y divide-ink-100">
                    <SpecRow label="หมวดหมู่" value={product.category} />
                    <SpecRow label="รหัสสินค้า (SKU)" value={product.sku || `SKU-${product.id}`} />
                    <SpecRow label="คงเหลือ" value={`${product.stock} ชิ้น`} />
                    <SpecRow label="คะแนน" value={`⭐ ${product.rating}`} />
                    <SpecRow label="ยอดขาย" value={`${product.salesCount} ชิ้น`} />
                  </dl>
                )}
                {tab === 'review' && (
                  <div className="rounded-2xl bg-ink-50 p-5 text-center">
                    <p className="text-2xl font-extrabold text-ink-900">⭐ {product.rating}</p>
                    <p className="mt-1 text-ink-500">
                      จากผู้ซื้อจริง {product.salesCount} ราย — ระบบรีวิวพร้อมรูป/วิดีโอ เร็วๆ นี้
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">คุณอาจสนใจ</p>
                <h2 className="section-title mt-1">สินค้าที่เกี่ยวข้อง</h2>
              </div>
              <Link to={`/?cat=${encodeURIComponent(product.category)}`} className="text-sm font-semibold text-brand hover:underline">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} campaign={campaign} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs text-ink-500">{product.title}</p>
            <p className="text-lg font-extrabold text-brand">{baht(product.price)}</p>
          </div>
          <button
            onClick={() => handleAdd(false)}
            disabled={soldOut}
            className="rounded-xl border-2 border-brand px-4 py-2.5 text-sm font-semibold text-brand disabled:opacity-50"
          >
            ใส่ตะกร้า
          </button>
          <button
            onClick={() => handleAdd(true)}
            disabled={soldOut}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            ซื้อเลย
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Badge({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
      <span>{icon}</span>
      {text}
    </span>
  )
}

function SpecRow({ label, value }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-700">{value}</dd>
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
