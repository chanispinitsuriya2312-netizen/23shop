import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import FlashSalePopup from '../components/FlashSalePopup'
import { subscribeProducts } from '../lib/shop'
import { subscribeCampaign } from '../lib/campaign'
import { subscribeSettings, defaultSettings } from '../lib/settings'
import { categories } from '../data/seedProducts'
import { useSeo, seoConfig } from '../lib/seo'

export default function Storefront() {
  const [params] = useSearchParams()
  const [products, setProducts] = useState([])
  const [campaign, setCampaign] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState(params.get('cat') || 'ทั้งหมด')

  useEffect(() => subscribeCampaign(setCampaign), [])
  useEffect(() => subscribeSettings(setSettings), [])

  // SEO: storefront meta + Store / ItemList structured data.
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
    return products.filter((p) => {
      const matchCat = cat === 'ทั้งหมด' || p.category === cat
      const matchSearch = !search || (p.title || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, cat, search])

  const featured = useMemo(() => products.filter((p) => p.isFeatured).slice(0, 4), [products])

  return (
    <div className="min-h-screen">
      <FlashSalePopup />
      <Navbar search={search} onSearch={setSearch} />

      <main className="mx-auto max-w-6xl px-4 pb-16">
        {/* Hero */}
        <section className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white sm:p-10">
          <h1 className="text-2xl font-extrabold sm:text-4xl">ช้อปสนุก ครบทุกไลฟ์สไตล์</h1>
          <p className="mt-2 max-w-lg text-sm text-white/90 sm:text-base">
            สินค้าคุณภาพคัดสรร ส่งไว ราคาดี — สั่งซื้อผ่านเว็บได้เลย ไม่ต้องโหลดแอป
          </p>
          {featured.length > 0 && (
            <div className="mt-5 flex gap-3 overflow-x-auto no-scrollbar">
              {featured.map((p) => (
                <div key={p.id} className="flex w-40 shrink-0 items-center gap-2 rounded-2xl bg-white/15 p-2">
                  <img src={p.imageUrl} alt={p.title} loading="lazy" className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{p.title}</p>
                    <p className="text-sm font-bold">฿{Number(p.price).toLocaleString('th-TH')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Categories */}
        <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                cat === c
                  ? 'bg-brand text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <section className="mt-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-slate-400">ไม่พบสินค้าที่ค้นหา</p>
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
        </section>
      </main>
    </div>
  )
}
