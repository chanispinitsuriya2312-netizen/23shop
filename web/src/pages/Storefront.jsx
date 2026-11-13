import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import FlashSalePopup from '../components/FlashSalePopup'
import { SkeletonGrid } from '../components/SkeletonCard'
import { subscribeProducts, productMedia } from '../lib/shop'
import { subscribeCampaign, isCampaignLive, countdownParts } from '../lib/campaign'
import { subscribeSettings, defaultSettings } from '../lib/settings'
import { categories } from '../data/seedProducts'
import { useSeo, seoConfig } from '../lib/seo'
import { baht } from '../lib/format'

const SORTS = [
  ['new', 'มาใหม่'],
  ['popular', 'ขายดี'],
  ['price-asc', 'ราคาต่ำ → สูง'],
  ['price-desc', 'ราคาสูง → ต่ำ']
]

export default function Storefront() {
  const [params] = useSearchParams()
  const [products, setProducts] = useState([])
  const [campaign, setCampaign] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState(params.get('cat') || 'ทั้งหมด')
  const [sort, setSort] = useState('new')
  const [now, setNow] = useState(Date.now())

  useEffect(() => subscribeCampaign(setCampaign), [])
  useEffect(() => subscribeSettings(setSettings), [])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useSeo({
    title: cat !== 'ทั้งหมด' ? `${cat} — สินค้าทั้งหมด` : null,
    description: seoConfig.DEFAULT_DESC,
    canonical: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: seoConfig.SITE_NAME,
      description: seoConfig.DEFAULT_DESC,
      url: seoConfig.SITE_URL
    }
  })

  useEffect(() => {
    const unsub = subscribeProducts((items) => {
      setProducts(items)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const matchCat = cat === 'ทั้งหมด' || p.category === cat
      const matchSearch = !search || (p.title || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
    const sorted = [...list]
    if (sort === 'price-asc') sorted.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'price-desc') sorted.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sort === 'popular') sorted.sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0))
    else sorted.sort((a, b) => Number(b.createdAt || b.productId || 0) - Number(a.createdAt || a.productId || 0))
    return sorted
  }, [products, cat, search, sort])

  const featured = useMemo(() => products.filter((p) => p.isFeatured).slice(0, 4), [products])
  const hero = featured[0]
  const heroImages = useMemo(() => (hero ? productMedia(hero).filter((m) => m.type === 'image').slice(0, 2) : []), [hero])

  const saleLive = isCampaignLive(campaign)
  const sale = useMemo(() => {
    if (!saleLive) return []
    if (campaign.scope === 'products') {
      const ids = (campaign.productIds || []).map(String)
      return products.filter((p) => ids.includes(String(p.id ?? p.productId))).slice(0, 6)
    }
    return [...products].sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0)).slice(0, 6)
  }, [products, campaign, saleLive])
  const cd = countdownParts((campaign?.endsAt || 0) - now)
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="min-h-screen">
      <FlashSalePopup />
      <div className="bg-ink-900 px-4 py-2 text-center text-[12px] font-medium tracking-wide text-white/90">
        {settings.announcement || 'ส่งฟรีเมื่อซื้อครบ ฿1,000 · จัดส่งทั่วไทย 1–3 วันทำการ'}
      </div>
      <Navbar search={search} onSearch={setSearch} />

      <main className="mx-auto max-w-6xl px-4 pb-10">
        {/* Hero */}
        <section className="mt-4 overflow-hidden rounded-[2rem] border border-ink-100 bg-white">
          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:p-12">
            <div>
              <p className="eyebrow">ShopHub · คัดสรรเพื่อคุณ</p>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
                ของดีที่คัดมาแล้ว
                <br />
                <span className="text-brand">พร้อมส่งถึงบ้าน</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
                สินค้าคุณภาพคัดสรรทุกชิ้น ส่งไว ราคายุติธรรม — สั่งซื้อออนไลน์ได้เลย ไม่ต้องโหลดแอป
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#products" className="btn-primary px-6 py-3">ช้อปเลย</a>
                {saleLive && <a href="#sale" className="btn-outline px-6 py-3">🔥 ดูโปรโมชัน</a>}
              </div>
              <dl className="mt-8 grid max-w-sm grid-cols-3 gap-4 border-t border-ink-100 pt-5">
                {[
                  ['1–3 วัน', 'จัดส่งไว'],
                  ['100%', 'ของแท้'],
                  ['7 วัน', 'คืนได้']
                ].map(([v, k]) => (
                  <div key={k}>
                    <dt className="text-lg font-extrabold text-ink-900">{v}</dt>
                    <dd className="text-xs text-ink-400">{k}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {hero && (
              <Link to={`/product/${hero.id}`} className="relative block">
                <div className="grid grid-cols-3 grid-rows-2 gap-3">
                  <div className="col-span-2 row-span-2 overflow-hidden rounded-3xl bg-ink-50">
                    <img
                      src={heroImages[0]?.url || hero.imageUrl}
                      alt={hero.title}
                      className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                    />
                  </div>
                  <div className="overflow-hidden rounded-3xl bg-ink-50">
                    <img
                      src={heroImages[1]?.url || hero.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-between rounded-3xl bg-ink-900 p-3 text-white">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">แนะนำ</span>
                    <div>
                      <p className="line-clamp-2 text-[11px] font-medium leading-snug">{hero.title}</p>
                      <p className="mt-1 text-sm font-bold text-brand-light">{baht(hero.price)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* Categories */}
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1" id="categories">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`chip ${cat === c ? 'chip-active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Flash sale */}
        {saleLive && sale.length > 0 && (
          <section id="sale" className="mt-8 rounded-[2rem] border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-white p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Flash Sale</p>
                <h2 className="section-title mt-1">{campaign.title}</h2>
                <p className="mt-1 text-sm text-ink-500">{campaign.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {[
                  [cd.hours, 'ชม.'],
                  [cd.minutes, 'นาที'],
                  [cd.seconds, 'วินาที']
                ].map(([v, label]) => (
                  <div key={label} className="min-w-[3.4rem] rounded-xl bg-ink-900 px-2 py-1.5 text-center text-white">
                    <p className="text-lg font-extrabold leading-none tabular-nums">{pad(v)}</p>
                    <p className="mt-0.5 text-[10px] text-white/50">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {sale.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="group card-surface overflow-hidden p-2">
                  <div className="aspect-square overflow-hidden rounded-xl bg-ink-50">
                    <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs font-medium text-ink-600">{p.title}</p>
                  <p className="text-sm font-extrabold text-brand">{baht(p.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All products */}
        <section className="mt-10" id="products">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">สินค้าทั้งหมด</p>
              <h2 className="section-title mt-1">
                {search ? `ผลการค้นหา "${search}"` : cat === 'ทั้งหมด' ? 'สินค้าทั้งหมด' : cat}
              </h2>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-500">
              เรียงโดย
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-700 outline-none focus:border-brand"
              >
                {SORTS.map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4">
            {loading ? (
              <SkeletonGrid count={8} />
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-ink-400">ไม่พบสินค้าที่ค้นหา</p>
                <button onClick={() => { setSearch(''); setCat('ทั้งหมด') }} className="mt-3 text-sm font-semibold text-brand hover:underline">
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    campaign={campaign}
                    showStock={settings.showStockOnCard}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust */}
        <section className="mt-12 grid gap-3 rounded-[2rem] border border-ink-100 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['ส่งไว', 'จัดส่งทั่วไทย 1–3 วันทำการ'],
            ['ของแท้ 100%', 'คัดสรรจากแหล่งที่เชื่อถือได้'],
            ['คืนได้ 7 วัน', 'ไม่พอใจคืนสินค้าได้ตามนโยบาย'],
            ['ชำระปลอดภัย', 'PromptPay QR หรือเก็บเงินปลายทาง']
          ].map(([t, d]) => (
            <div key={t}>
              <p className="text-sm font-bold text-ink-900">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">{d}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer store={settings} />
    </div>
  )
}
