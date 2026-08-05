import { Link } from 'react-router-dom'
import { baht } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { isProductInCampaign } from '../lib/campaign'

export default function ProductCard({ product, campaign, showStock = true }) {
  const { add } = useCart()
  const toast = useToast()
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

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      <Link to={`/product/${product.id}`} className="block relative">
        <div className="aspect-square overflow-hidden bg-slate-100">
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-brand px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {product.isFeatured && (
          <span className="absolute right-2 top-2 rounded-lg bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">
            แนะนำ
          </span>
        )}
        {inCampaign && (
          <span className="absolute bottom-2 left-2 rounded-lg bg-pink-600 px-2 py-0.5 text-xs font-bold text-white shadow">
            🔥 {campaignLabel}
          </span>
        )}
      </Link>

      <div className="p-3">
        <Link to={`/product/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-700 hover:text-brand">
            {product.title}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-brand">{baht(product.price)}</span>
          {discount > 0 && (
            <span className="text-xs text-slate-400 line-through">{baht(product.originalPrice)}</span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>⭐ {product.rating}</span>
          {showStock && (
            <span className={Number(product.stock) > 0 ? '' : 'text-red-500'}>
              {Number(product.stock) > 0 ? `คงเหลือ ${product.stock}` : 'สินค้าหมด'}
            </span>
          )}
          <span>ขายแล้ว {product.salesCount}</span>
        </div>
        <button
          onClick={() => {
            add(product, 1)
            toast.success(`เพิ่ม "${product.title}" ลงตะกร้าแล้ว`)
          }}
          className="mt-3 w-full rounded-xl bg-brand py-2 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98]"
        >
          เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  )
}
