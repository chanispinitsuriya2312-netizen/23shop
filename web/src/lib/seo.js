import { useEffect } from 'react'

const SITE_NAME = 'ShopHub'
const SITE_URL = 'https://shophub-23.web.app'
const DEFAULT_DESC = 'ShopHub ร้านค้าออนไลน์ — อิเล็กทรอนิกส์ แฟชั่น ของใช้ในบ้าน ความงาม ราคาดี ส่งไว ปลอดภัย'
const DEFAULT_IMAGE = `${SITE_URL}/favicon.svg`

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Lightweight SEO head manager for a Vite SPA (no extra dependency, ฿0).
 * Sets <title>, description, canonical, Open Graph, Twitter Card and an
 * optional JSON-LD structured-data block (e.g. Product / Store schema).
 */
export function useSeo({ title, description, canonical, image, type = 'website', jsonLd } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ร้านค้าออนไลน์`
    const desc = description || DEFAULT_DESC
    const url = canonical ? (canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`) : SITE_URL
    const img = image || DEFAULT_IMAGE

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    upsertLink('canonical', url)

    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', img)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)
    upsertMeta('name', 'twitter:image', img)

    const id = 'ld-json-page'
    document.getElementById(id)?.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = id
      script.text = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
    return () => document.getElementById(id)?.remove()
  }, [title, description, canonical, image, type, JSON.stringify(jsonLd)])
}

export const seoConfig = { SITE_NAME, SITE_URL, DEFAULT_DESC, DEFAULT_IMAGE }
