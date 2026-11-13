import { useState } from 'react'
import { Link } from 'react-router-dom'
import { baht } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { isProductInCampaign } from '../lib/campaign'
import { productMedia } from '../lib/shop'
import { useWishlist } from '../context/WishlistContext'

export default function ProductCard({ product, campaign, showStock = true }) {
  const { add } = useCart()
  const { has, toggle } = useWishlist()
  const toast = useToast()
  const [hovered, setHovered] = useState(false)
  const liked = has(product.id)

  const images = productMedia(product).filter((m) => m.type === 'image')
  const primary = images[0]?.url || product.imageUrl
  const secondary = images[1]?.url

  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0
  const inCampaign = isProductInCampaign(campaign, product.id ?? product.productId)
  const campaignLabel =
    inCampaign && campaign
      ? campaign.discountType === 'amount'
        ? `ลด ${Number(campaign.discountAmountPerItem).toLocaleString('th-TH')}฿/ชิ้น`
        : `ลด ${campaign.discountPercent}%`
      : ''
  const soldOut = Number(product.stock) <= 0
  const lowStock = Number(product.stock) > 0 && Number(product.stock) <= 5

  return (
    <article className="group card-surface relative flex flex-col overflow-hidden transition duration-300 hover:shadow-card">
      <Link to={`/product/${product.id}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-ink-50">
          <img
            src={primary}
            alt={product.title}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${
              hovered && secondary ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {secondary && (
            <img
              src={secondary}
              alt={product.title}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          {soldOut && (
            <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[1px]">
              <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">
                สินค้าหมด
              </span>
            </div>
          )}
          {discount > 0 && !soldOut && (
            <span className="absolute left-2.5 top-2.5 rounded-md bg-ink-900 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
              −{discount}%
            </span>
          )}
          {product.isFeatured && !soldOut && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-ink-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              แนะนำ
            </span>
          )}
          {inCampaign && !soldOut && (
            <span className="absolute bottom-2.5 left-2.5 rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {campaignLabel}
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggle(product.id)
            }}
            aria-label={liked ? 'เอาออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
            className="absolute bottom-2.5 right-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-ink-500 shadow-sm transition hover:text-brand"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" className={liked ? 'text-brand' : ''}>
              <path d="M12 20.5C7 16.6 3 13.3 3 9.2A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9 3.2c0 4.1-4 7.4-9 11.3Z" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <Link to={`/product/${product.id}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <h3 className="line-clamp-2 min-h-[2.6rem] text-[13.5px] font-medium leading-snug text-ink-700 transition group-hover:text-ink-900">
            {product.title}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-lg font-extrabold tracking-tight text-brand">{baht(product.price)}</span>
          {discount > 0 && (
            <span className="text-xs text-ink-300 line-through">{baht(product.originalPrice)}</span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between text-[11px] text-ink-400">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
            </svg>
            {product.rating || '-'}
          </span>
          {showStock && (
            <span className={lowStock ? 'font-semibold text-brand' : ''}>
              {soldOut ? 'หมด' : lowStock ? `เหลือ ${product.stock}` : `คงเหลือ ${product.stock}`}
            </span>
          )}
          <span>ขายแล้ว {product.salesCount || 0}</span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault()
            add(product, 1)
            toast.success(`เพิ่ม "${product.title}" ลงตะกร้าแล้ว`)
          }}
          disabled={soldOut}
          className="mt-3 w-full rounded-xl bg-ink-900 py-2.5 text-sm font-semibold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
        >
          {soldOut ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
        </button>
      </div>
    </article>
  )
}
