import { useMarketing } from '../lib/marketing'
import CartDrawer from './CartDrawer'
import ContactRail from './ContactRail'
import AbandonedCart from './AbandonedCart'
import MobileNav from './MobileNav'

export default function SiteChrome() {
  useMarketing()
  return (
    <>
      <CartDrawer />
      <ContactRail />
      <AbandonedCart />
      <MobileNav />
    </>
  )
}
