// Contact channels shown in the floating "ติดต่อร้าน" rail.
// Admin manages the list in Settings → config/store.contactChannels.

export const CHANNEL_TYPES = [
  { key: 'line', label: 'LINE', placeholder: '@shophub หรือลิงก์ LINE', color: '#06c755', icon: 'line' },
  { key: 'phone', label: 'โทรศัพท์', placeholder: '081-234-5678', color: '#ff5722', icon: 'phone' },
  { key: 'email', label: 'อีเมล', placeholder: 'shop@example.com', color: '#0ea5e9', icon: 'mail' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/ร้าน', color: '#1877f2', icon: 'facebook' },
  { key: 'messenger', label: 'Messenger', placeholder: 'https://m.me/ร้าน หรือชื่อเพจ', color: '#0084ff', icon: 'messenger' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/ร้าน', color: '#e1306c', icon: 'instagram' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@ร้าน', color: '#111827', icon: 'tiktok' },
  { key: 'shopee', label: 'Shopee', placeholder: 'ลิงก์ร้าน Shopee', color: '#ee4d2d', icon: 'bag' },
  { key: 'lazada', label: 'Lazada', placeholder: 'ลิงก์ร้าน Lazada', color: '#0f146d', icon: 'bag' },
  { key: 'website', label: 'เว็บไซต์', placeholder: 'https://example.com', color: '#475569', icon: 'globe' },
  { key: 'telegram', label: 'Telegram', placeholder: '@username หรือลิงก์', color: '#229ed9', icon: 'send' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'เบอร์พร้อมรหัสประเทศ', color: '#25d366', icon: 'whatsapp' },
  { key: 'map', label: 'แผนที่ร้าน', placeholder: 'ที่อยู่ร้าน', color: '#16a34a', icon: 'pin' }
]

const byType = Object.fromEntries(CHANNEL_TYPES.map((t) => [t.key, t]))

export function channelType(key) {
  return byType[key] || CHANNEL_TYPES[0]
}

export function withHttps(url) {
  const v = String(url || '').trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

export function buildHref(type, raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  switch (type) {
    case 'line':
      if (/^https?:\/\//i.test(value)) return value
      return `https://line.me/R/ti/p/${encodeURIComponent(value.startsWith('@') ? value : `@${value}`)}`
    case 'phone':
      return `tel:${value.replace(/[^\d+]/g, '')}`
    case 'email':
      return `mailto:${value}`
    case 'messenger':
      return /^https?:\/\//i.test(value) ? value : `https://m.me/${encodeURIComponent(value.replace(/^@/, ''))}`
    case 'telegram':
      if (/^https?:\/\//i.test(value)) return value
      return `https://t.me/${encodeURIComponent(value.replace(/^@/, ''))}`
    case 'whatsapp': {
      const digits = value.replace(/[^\d]/g, '')
      return digits ? `https://wa.me/${digits}` : ''
    }
    case 'map':
      return `https://maps.google.com/?q=${encodeURIComponent(value)}`
    default:
      return withHttps(value)
  }
}

export function activeChannels(settings) {
  const list = Array.isArray(settings?.contactChannels) ? settings.contactChannels : []
  return list
    .filter((c) => c && c.enabled !== false && String(c.value || '').trim())
    .map((c) => ({ ...c, type: c.type || 'line', href: buildHref(c.type, c.value) }))
}
