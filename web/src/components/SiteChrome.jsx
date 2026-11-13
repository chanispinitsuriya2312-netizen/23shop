import { useMarketing } from '../lib/marketing'
import CartDrawer from './CartDrawer'
import LineFab from './LineFab'
import AbandonedCart from './AbandonedCart'
import MobileNav from './MobileNav'

export default function SiteChrome() {
  useMarketing()
  return (
    <>
      <CartDrawer />
      <LineFab />
      <AbandonedCart />
      <MobileNav />
    </>
  )
}
