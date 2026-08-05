import { useEffect, useState } from 'react'
import { youTubeEmbed } from '../lib/shop'

// Product media gallery: main viewer (image / video) + thumbnail strip.
// Videos show a ▶ badge; captions render under the active media.
// Supports image URLs, YouTube links (embed) and direct video files (mp4/webm).
export default function MediaGallery({ media = [], title = '' }) {
  const items = media.length ? media : [{ type: 'image', url: '', caption: '' }]
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    setActive(0)
  }, [media])

  const current = items[Math.min(active, items.length - 1)] || items[0]

  return (
    <div>
      {/* Main viewer */}
      <div className="group relative overflow-hidden rounded-3xl bg-white ring-1 ring-slate-100">
        <div className="aspect-square w-full">
          <MediaView item={current} title={title} onZoom={() => current.type === 'image' && setZoom(true)} />
        </div>

        {items.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
            {active + 1} / {items.length}
          </div>
        )}
      </div>

      {/* Caption under the active media */}
      {current.caption && (
        <p className="mt-2 text-center text-sm text-slate-500">{current.caption}</p>
      )}

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((m, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === active ? 'ring-brand' : 'ring-transparent hover:ring-slate-200'
              }`}
              aria-label={`สื่อชิ้นที่ ${i + 1}`}
            >
              <Thumb item={m} />
              {m.type === 'video' && (
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                  <PlayIcon className="h-5 w-5 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoom / fullscreen lightbox (images only) */}
      {zoom && current.type === 'image' && current.url && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          <img
            src={current.url}
            alt={current.caption || title}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
          />
          <button
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700"
            onClick={() => setZoom(false)}
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

function MediaView({ item, title, onZoom }) {
  if (!item?.url) {
    return <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-300">ไม่มีรูปภาพ</div>
  }
  if (item.type === 'video') {
    const embed = youTubeEmbed(item.url)
    if (embed) {
      return (
        <iframe
          src={embed}
          title={item.caption || title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }
    return (
      <video src={item.url} controls playsInline className="h-full w-full bg-black object-contain">
        เบราว์เซอร์ของคุณไม่รองรับวิดีโอ
      </video>
    )
  }
  return (
    <img
      src={item.url}
      alt={item.caption || title}
      onClick={onZoom}
      className="h-full w-full cursor-zoom-in object-cover"
    />
  )
}

function Thumb({ item }) {
  if (item.type === 'video') {
    const embed = youTubeEmbed(item.url)
    if (embed) {
      const id = embed.split('/embed/')[1]
      return <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" />
    }
    return <div className="h-full w-full bg-slate-800" />
  }
  return <img src={item.url} alt="" className="h-full w-full object-cover" />
}

function PlayIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
