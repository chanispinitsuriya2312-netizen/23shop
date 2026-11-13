import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const WishlistContext = createContext(null)
const KEY = 'shophub_wishlist'

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ids))
  }, [ids])

  function toggle(id) {
    const key = String(id)
    setIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]))
  }

  const has = (id) => ids.includes(String(id))
  const count = ids.length
  const value = useMemo(() => ({ ids, toggle, has, count }), [ids])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
