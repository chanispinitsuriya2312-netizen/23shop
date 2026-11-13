import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { trackEvent } from '../lib/track'

const CartContext = createContext(null)
const STORAGE_KEY = 'shophub_cart'
const SINCE_KEY = 'shophub_cart_since'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    if (items.length > 0 && !localStorage.getItem(SINCE_KEY)) {
      localStorage.setItem(SINCE_KEY, String(Date.now()))
    } else if (items.length === 0) {
      localStorage.removeItem(SINCE_KEY)
    }
  }, [items])

  function add(product, qty = 1) {
    trackEvent('AddToCart', {
      currency: 'THB',
      value: (Number(product.price) || 0) * qty,
      items: [{ item_id: String(product.id ?? product.productId), item_name: product.title, price: product.price, quantity: qty }]
    })
    setItems((prev) => {
      const key = String(product.id ?? product.productId)
      const found = prev.find((i) => String(i.id ?? i.productId) === key)
      if (found) {
        return prev.map((i) =>
          String(i.id ?? i.productId) === key ? { ...i, quantity: i.quantity + qty } : i
        )
      }
      return [
        ...prev,
        {
          id: product.id ?? String(product.productId),
          productId: product.productId ?? Number(product.id) ?? 0,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: qty
        }
      ]
    })
  }

  function setQty(id, qty) {
    setItems((prev) =>
      prev
        .map((i) => (String(i.id) === String(id) ? { ...i, quantity: Math.max(0, qty) } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  function remove(id) {
    setItems((prev) => prev.filter((i) => String(i.id) !== String(id)))
  }

  function clear() {
    setItems([])
  }

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])

  const value = {
    items,
    add,
    setQty,
    remove,
    clear,
    count,
    subtotal,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false)
  }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
