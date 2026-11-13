const pad = (n) => String(n).padStart(2, '0')

export function startOfDay(ms = Date.now()) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function dayKey(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function seriesByDay(orders, days = 7) {
  const start = startOfDay()
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    const ms = start - i * 86400000
    const d = new Date(ms)
    buckets.push({ key: dayKey(ms), label: `${d.getDate()}/${d.getMonth() + 1}`, total: 0, count: 0 })
  }
  const map = new Map(buckets.map((b) => [b.key, b]))
  for (const o of orders) {
    const b = map.get(dayKey(Number(o.createdAt) || 0))
    if (!b) continue
    b.total += Number(o.totalAmount) || 0
    b.count += 1
  }
  return buckets
}

export function computeKpis(orders) {
  const today = startOfDay()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const delivered = orders.filter((o) => o.status === 'Delivered')
  const sum = (list) => list.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0)

  return {
    ordersTotal: orders.length,
    revenueTotal: sum(orders),
    revenueToday: sum(orders.filter((o) => Number(o.createdAt) >= today)),
    ordersToday: orders.filter((o) => Number(o.createdAt) >= today).length,
    revenueMonth: sum(orders.filter((o) => Number(o.createdAt) >= monthStart.getTime())),
    openOrders: orders.filter((o) => o.status !== 'Delivered').length,
    pendingSlips: orders.filter((o) => o.paymentStatus === 'pending_review').length,
    shipped: orders.filter((o) => o.status === 'Shipped').length,
    delivered: delivered.length,
    aov: orders.length ? Math.round(sum(orders) / orders.length) : 0
  }
}

export function lowStock(products, threshold = 5) {
  return products
    .filter((p) => Number(p.stock) <= threshold)
    .sort((a, b) => Number(a.stock) - Number(b.stock))
}

export function topProducts(orders, limit = 5) {
  const map = new Map()
  for (const o of orders) {
    for (const it of o.items || []) {
      const key = String(it.productId || it.title)
      const cur = map.get(key) || { title: it.title, quantity: 0, revenue: 0 }
      cur.quantity += Number(it.quantity) || 0
      cur.revenue += (Number(it.price) || 0) * (Number(it.quantity) || 0)
      map.set(key, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

export function salesByCategory(orders, products) {
  const catById = new Map(products.map((p) => [String(p.id ?? p.productId), p.category]))
  const map = new Map()
  for (const o of orders) {
    for (const it of o.items || []) {
      const cat = catById.get(String(it.productId)) || 'อื่น ๆ'
      const cur = map.get(cat) || { category: cat, quantity: 0, revenue: 0 }
      cur.quantity += Number(it.quantity) || 0
      cur.revenue += (Number(it.price) || 0) * (Number(it.quantity) || 0)
      map.set(cat, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

export function computeCustomers(orders) {
  const map = new Map()
  for (const o of orders) {
    const key = String(o.customerPhone || o.customerName || 'ไม่ระบุ')
    const cur = map.get(key) || {
      name: o.customerName || '-',
      phone: o.customerPhone || '-',
      address: o.shippingAddress || '',
      orders: 0,
      spent: 0,
      lastOrderAt: 0
    }
    cur.orders += 1
    cur.spent += Number(o.totalAmount) || 0
    cur.lastOrderAt = Math.max(cur.lastOrderAt, Number(o.createdAt) || 0)
    cur.name = o.customerName || cur.name
    cur.address = o.shippingAddress || cur.address
    map.set(key, cur)
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent)
}

// ---------- CSV ----------

function esc(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers, rows) {
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

export function downloadCsv(filename, headers, rows) {
  const blob = new Blob(['\ufeff' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ordersToRows(orders) {
  return orders.map((o) => [
    o.orderCode,
    new Date(Number(o.createdAt) || 0).toLocaleString('th-TH'),
    o.customerName,
    o.customerPhone,
    o.shippingAddress,
    o.status,
    o.paymentStatus,
    o.paymentMethod,
    o.subtotal,
    o.discountAmount,
    o.shippingFee,
    o.totalAmount,
    o.promoCode,
    o.courier,
    o.trackingNumber,
    (o.items || []).map((i) => `${i.title} x${i.quantity}`).join(' | ')
  ])
}

export const ORDER_CSV_HEADERS = [
  'Order Code',
  'วันที่',
  'ชื่อลูกค้า',
  'เบอร์โทร',
  'ที่อยู่',
  'สถานะ',
  'การชำระ',
  'วิธีชำระ',
  'ยอดสินค้า',
  'ส่วนลด',
  'ค่าส่ง',
  'ยอดรวม',
  'โค้ด',
  'ขนส่ง',
  'เลขพัสดุ',
  'รายการสินค้า'
]
