import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { useWishlist } from '../context/WishlistContext'
import { subscribeProducts } from '../lib/shop'
import { subscribeCampaign } from '../lib/campaign'
import { useSeo } from '../lib/seo'

export default function Wishlist() {
  const { ids } = useWishlist()
  const [products, setProducts] = useState([])
  const [campaign, setCampaign] = useState(null)

  useEffect(() => subscribeProducts(setProducts), [])
  useEffect(() => subscribeCampaign(setCampaign), [])
  useSeo({ title: 'สินค้าที่ถูกใจ', canonical: '/wishlist' })

  const liked = products.filter((p) => ids.includes(String(p.id)))

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="eyebrow">Wishlist</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">สินค้าที่ถูกใจ</h1>

        {liked.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-ink-400">ยังไม่มีสินค้าที่ถูกใจ — กดรูปหัวใจบนการ์ดสินค้าเพื่อเก็บไว้</p>
            <Link to="/" className="btn-primary mt-4 inline-block px-5 py-2.5">เลือกซื้อสินค้า</Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {liked.map((p) => (
              <ProductCard key={p.id} product={p} campaign={campaign} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
