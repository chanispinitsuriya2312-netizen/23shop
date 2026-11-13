import { useEffect, useMemo, useState } from 'react'
import { subscribeProducts, upsertProduct, deleteProduct, productMedia } from '../../lib/shop'
import { subscribeCategories, saveCategories } from '../../lib/categories'
import { baht } from '../../lib/format'
import { downloadCsv } from '../../lib/adminStats'

const EMPTY = {
  title: '',
  price: '',
  originalPrice: '',
  category: '',
  description: '',
  imageUrl: '',
  media: [],
  stock: '',
  rating: '',
  salesCount: '',
  isFeatured: false,
  relatedIds: []
}

export default function Products({ products }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  const cats = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products])
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    return products.filter(
      (p) =>
        (cat === 'all' || p.category === cat) &&
        (!n || String(p.title || '').toLowerCase().includes(n) || String(p.sku || '').toLowerCase().includes(n))
    )
  }, [products, q, cat])

  async function quickSave(p, patch) {
    await upsertProduct({ ...p, ...patch })
    setMsg(`อัปเดต "${p.title}" แล้ว`)
    setTimeout(() => setMsg(''), 2000)
  }

  async function duplicate(p) {
    const { id, productId, ...rest } = p
    await upsertProduct({ ...rest, id: undefined, productId: undefined, title: `${p.title} (สำเนา)`, sku: '' })
  }

  function exportCsv() {
    downloadCsv(
      `products-${Date.now()}.csv`,
      ['title', 'price', 'originalPrice', 'category', 'stock', 'imageUrl', 'description', 'isFeatured'],
      filtered.map((p) => [p.title, p.price, p.originalPrice, p.category, p.stock, p.imageUrl, p.description, p.isFeatured ? 1 : 0])
    )
  }

  function importCsv(file) {
    file.text().then(async (text) => {
      const rows = parseCsv(text)
      if (rows.length < 2) return
      const headers = rows[0].map((h) => h.trim().toLowerCase())
      let count = 0
      for (const row of rows.slice(1)) {
        const obj = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
        if (!obj.title) continue
        await upsertProduct({
          title: obj.title,
          price: obj.price,
          originalPrice: obj.originalprice || obj.originalPrice,
          category: obj.category,
          stock: obj.stock,
          imageUrl: obj.imageurl || obj.imageUrl,
          description: obj.description,
          isFeatured: String(obj.isfeatured || obj.isFeatured) === '1'
        })
        count++
      }
      setMsg(`นำเข้าสินค้า ${count} รายการแล้ว`)
      setTimeout(() => setMsg(''), 3000)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">สินค้า</h1>
          <p className="mt-1 text-xs text-ink-400">{products.length} รายการในระบบ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-600 hover:border-brand hover:text-brand">
            Export CSV
          </button>
          <label className="cursor-pointer rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-600 hover:border-brand hover:text-brand">
            Import CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files[0] && importCsv(e.target.files[0])} />
          </label>
          <button onClick={() => setEditing(EMPTY)} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            + เพิ่มสินค้า
          </button>
        </div>
      </div>

      <div className="card-surface flex flex-wrap items-center gap-2 p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / SKU" className="input min-w-[180px] flex-1" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-xl border border-ink-200 px-2.5 py-2 text-sm">
          <option value="all">ทุกหมวดหมู่</option>
          {cats.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {msg && <span className="text-xs font-medium text-green-600">{msg}</span>}
      </div>

      <CategoryPanel />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="card-surface flex gap-3 p-3">
            <img src={p.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-ink-800">{p.title}</p>
              <p className="mt-0.5 text-xs text-ink-400">{p.category} · SKU {p.sku || `SKU-${p.id}`}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="font-bold text-brand">{baht(p.price)}</span>
                <span className="text-ink-300">·</span>
                <label className="flex items-center gap-1 text-ink-500">
                  สต็อก
                  <input
                    type="number"
                    defaultValue={p.stock}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== Number(p.stock)) quickSave(p, { stock: Number(e.target.value) })
                    }}
                    className="w-14 rounded-md border border-ink-200 px-1 py-0.5 text-xs"
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button onClick={() => setEditing(p)} className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200">แก้ไข</button>
                <button onClick={() => duplicate(p)} className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200">ทำสำเนา</button>
                <button
                  onClick={() => {
                    if (confirm(`ลบสินค้า "${p.title}" ?`)) deleteProduct(p.id)
                  }}
                  className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <ProductEditor product={editing} products={products} onClose={() => setEditing(null)} />}
    </div>
  )
}

function CategoryPanel() {
  const [list, setList] = useState([])
  const [draft, setDraft] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => subscribeCategories(setList), [])

  async function add() {
    const value = draft.trim()
    if (!value) return
    const next = [...new Set([...list, value])]
    setDraft('')
    await saveCategories(next)
    setMsg('บันทึกแล้ว')
    setTimeout(() => setMsg(''), 2000)
  }

  async function remove(c) {
    if (!confirm(`ลบหมวดหมู่ "${c}" ? (สินค้าเดิมยังอยู่)`)) return
    await saveCategories(list.filter((x) => x !== c))
  }

  return (
    <div className="card-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink-700">หมวดหมู่หน้าร้าน</span>
        {list.length === 0 && <span className="text-xs text-ink-400">ยังไม่มีหมวดที่กำหนดเอง — หน้าร้านใช้หมวดจากสินค้าและค่าเริ่มต้น</span>}
        {list.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
            {c}
            <button onClick={() => remove(c)} className="text-ink-400 hover:text-red-500" aria-label={`ลบ ${c}`}>✕</button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="เพิ่มหมวดหมู่ใหม่ เช่น สัตว์เลี้ยง"
          className="input max-w-xs"
        />
        <button onClick={add} className="shrink-0 rounded-xl bg-panel px-4 py-2 text-sm font-semibold text-white">เพิ่ม</button>
        {msg && <span className="self-center text-xs font-medium text-green-600">{msg}</span>}
      </div>
    </div>
  )
}

function ProductEditor({ product, products, onClose }) {
  const [form, setForm] = useState(() => ({ ...product, media: productMedia(product) }))
  const [saving, setSaving] = useState(false)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  const media = form.media || []
  const setMedia = (next) => setForm((f) => ({ ...f, media: next }))
  const addMedia = (type) => setMedia([...media, { type, url: '', caption: '' }])
  const updateMedia = (i, patch) => setMedia(media.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  const removeMedia = (i) => setMedia(media.filter((_, idx) => idx !== i))
  function moveMedia(i, dir) {
    const j = i + dir
    if (j < 0 || j >= media.length) return
    const next = [...media]
    ;[next[i], next[j]] = [next[j], next[i]]
    setMedia(next)
  }

  const relatedIds = (form.relatedIds || []).map(String)
  function toggleRelated(id) {
    const key = String(id)
    set('relatedIds', relatedIds.includes(key) ? relatedIds.filter((x) => x !== key) : [...relatedIds, key])
  }

  async function save() {
    setSaving(true)
    try {
      await upsertProduct(form)
      onClose()
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{form.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="ชื่อสินค้า" value={form.title} onChange={(v) => set('title', v)} full />
          <Input label="ราคา" type="number" value={form.price} onChange={(v) => set('price', v)} />
          <Input label="ราคาเดิม" type="number" value={form.originalPrice} onChange={(v) => set('originalPrice', v)} />
          <Input label="หมวดหมู่" value={form.category} onChange={(v) => set('category', v)} />
          <Input label="SKU" value={form.sku} onChange={(v) => set('sku', v)} />
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <Input label="สต็อก" type="number" value={form.stock} onChange={(v) => set('stock', v)} />
            <Input label="เรตติ้ง" type="number" value={form.rating} onChange={(v) => set('rating', v)} />
            <Input label="ยอดขาย" type="number" value={form.salesCount} onChange={(v) => set('salesCount', v)} />
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-600">รูปภาพ / วิดีโอ</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => addMedia('image')} className="rounded-lg bg-ink-100 px-2 py-1 text-xs font-medium text-ink-600">+ ภาพ</button>
              <button type="button" onClick={() => addMedia('video')} className="rounded-lg bg-ink-100 px-2 py-1 text-xs font-medium text-ink-600">+ วิดีโอ</button>
            </div>
          </div>
          {media.length === 0 && (
            <p className="rounded-xl bg-ink-50 p-3 text-center text-xs text-ink-400">ยังไม่มีสื่อ — ภาพแรกจะเป็นรูปหลัก</p>
          )}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {media.map((m, i) => (
              <div key={i} className="rounded-xl bg-ink-50 p-2 ring-1 ring-ink-100">
                <div className="flex items-center gap-1.5">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-xs ring-1 ring-ink-200">{i === 0 ? '★' : i + 1}</span>
                  <select value={m.type} onChange={(e) => updateMedia(i, { type: e.target.value })} className="rounded-lg border border-ink-200 px-1.5 py-1 text-xs">
                    <option value="image">ภาพ</option>
                    <option value="video">วิดีโอ</option>
                  </select>
                  <input
                    value={m.url}
                    onChange={(e) => updateMedia(i, { url: e.target.value })}
                    placeholder={m.type === 'video' ? 'ลิงก์ YouTube หรือ .mp4' : 'ลิงก์รูปภาพ (URL)'}
                    className="min-w-0 flex-1 rounded-lg border border-ink-200 px-2 py-1 text-xs"
                  />
                  <button type="button" onClick={() => moveMedia(i, -1)} disabled={i === 0} className="px-1 text-ink-400 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveMedia(i, 1)} disabled={i === media.length - 1} className="px-1 text-ink-400 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeMedia(i)} className="px-1 text-red-400">✕</button>
                </div>
                <input
                  value={m.caption}
                  onChange={(e) => updateMedia(i, { caption: e.target.value })}
                  placeholder="คำบรรยายภาพ (ไม่บังคับ)"
                  className="mt-1.5 w-full rounded-lg border border-ink-200 px-2 py-1 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-ink-600">รายละเอียด</span>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="input" />
        </label>

        <label className="mt-3 flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={!!form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
          สินค้าแนะนำ (แสดงใน Hero)
        </label>

        <div className="mt-4">
          <p className="text-xs font-medium text-ink-500">สินค้าที่เกี่ยวข้อง / ซื้อคู่กัน ({relatedIds.length})</p>
          <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto rounded-xl border border-ink-200 p-2">
            {products.filter((p) => String(p.id) !== String(form.id)).map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-ink-50">
                <input type="checkbox" checked={relatedIds.includes(String(p.id))} onChange={() => toggleRelated(p.id)} className="h-3.5 w-3.5" />
                <img src={p.imageUrl} alt="" className="h-6 w-6 rounded object-cover" />
                <span className="line-clamp-1 flex-1 text-ink-600">{p.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-ink-200 py-2.5 font-medium text-ink-600">ยกเลิก</button>
          <button onClick={save} disabled={saving || !form.title} className="flex-1 rounded-2xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', full }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-medium text-ink-600">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  )
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (c !== '\r') cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}
