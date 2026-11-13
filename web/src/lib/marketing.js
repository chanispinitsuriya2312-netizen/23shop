import { useEffect } from 'react'
import { subscribeSettings } from './settings'

export { trackEvent } from './track'

const loaded = { ga: false, fb: false, tt: false }

function injectScript(src, onload) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  if (onload) s.onload = onload
  document.head.appendChild(s)
}

function ensureGa4(id) {
  if (!id || loaded.ga) return
  loaded.ga = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id)
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`)
}

function ensureMetaPixel(id) {
  if (!id || loaded.fb) return
  loaded.fb = true
  !(function (f, b, e, v) {
    if (f.fbq) return
    const n = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    })
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const t = b.createElement(e)
    t.async = true
    t.src = v
    const s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  window.fbq('init', id)
  window.fbq('track', 'PageView')
}

function ensureTikTok(id) {
  if (!id || loaded.tt) return
  loaded.tt = true
  !(function (w, d, t) {
    w.TiktokAnalyticsObject = t
    const ttq = (w[t] = w[t] || [])
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']
    ttq.setAndDefer = function (o, m) {
      o[m] = function () {
        o.push([m].concat(Array.prototype.slice.call(arguments, 0)))
      }
    }
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
    ttq.load = function (e, n) {
      const url = 'https://analytics.tiktok.com/i18n/pixel/events.js'
      ttq._i = ttq._i || {}
      ttq._i[e] = []
      ttq._i[e]._u = url
      ttq._t = ttq._t || {}
      ttq._t[e] = +new Date()
      ttq._o = ttq._o || {}
      ttq._o[e] = n || {}
      const s = d.createElement('script')
      s.type = 'text/javascript'
      s.async = true
      s.src = `${url}?sdkid=${e}&lib=${t}`
      const f = d.getElementsByTagName('script')[0]
      f.parentNode.insertBefore(s, f)
    }
    ttq.load(id)
    ttq.page()
  })(window, document, 'ttq')
}

// Loads analytics only when an ID is configured in admin settings (Spark-safe).
export function useMarketing() {
  useEffect(() => {
    const unsub = subscribeSettings((s) => {
      ensureGa4(s.ga4Id)
      ensureMetaPixel(s.metaPixelId)
      ensureTikTok(s.tiktokPixelId)
    })
    return unsub
  }, [])
}
