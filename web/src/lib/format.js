export function baht(n) {
  const v = Number(n) || 0
  return '฿' + v.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatDate(ms) {
  if (!ms) return '-'
  const d = typeof ms === 'object' && ms.toDate ? ms.toDate() : new Date(ms)
  try {
    return d.toLocaleString('th-TH', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return d.toISOString()
  }
}

// Thai label + colour for each canonical (English) order status.
export function statusInfo(status) {
  switch (status) {
    case 'Order Placed':
      return { label: 'รับออเดอร์แล้ว', color: 'bg-amber-100 text-amber-700' }
    case 'Processing':
      return { label: 'กำลังเตรียมจัดส่ง', color: 'bg-blue-100 text-blue-700' }
    case 'Shipped':
      return { label: 'อยู่ระหว่างจัดส่ง', color: 'bg-indigo-100 text-indigo-700' }
    case 'Delivered':
      return { label: 'จัดส่งสำเร็จ', color: 'bg-green-100 text-green-700' }
    case 'ยกเลิก':
    case 'Cancelled':
      return { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' }
    default:
      return { label: status || '-', color: 'bg-slate-100 text-slate-600' }
  }
}
