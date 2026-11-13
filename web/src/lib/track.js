const META_STANDARD = new Set(['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Search'])
const TIKTOK_STANDARD = new Set(['ViewContent', 'AddToCart', 'InitiateCheckout', 'CompletePayment', 'Search'])

// Fires a conversion event to whichever pixels are loaded (no-op otherwise).
export function trackEvent(name, params = {}) {
  try {
    window.gtag?.('event', name, params)
    if (META_STANDARD.has(name)) window.fbq?.('track', name, params)
    if (TIKTOK_STANDARD.has(name)) window.ttq?.('track', name, params)
  } catch (e) {
    console.warn('[marketing] track failed:', e?.message)
  }
}
