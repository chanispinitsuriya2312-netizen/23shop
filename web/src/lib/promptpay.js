import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// ---------- PromptPay QR (EMVCo standard, client-side, ฿0) ----------
//
// Generates a real PromptPay payload string that Thai banking apps can scan.
// No payment gateway and no server are required — the QR is computed locally
// from the merchant's PromptPay ID (mobile number or national/tax ID) and the
// order amount, so it stays free on the Firebase Spark plan.

// Payment config lives at config/payment so the admin can edit it from the
// dashboard. A bundled default keeps checkout working before any config exists.
export const defaultPayment = {
  // Replace with a real mobile number or 13-digit national/tax ID in the admin.
  promptPayId: '0000000000',
  merchantName: 'ShopHub',
  // Whether PromptPay is offered as a payment option at checkout.
  enabled: true,
  // Instruction shown under the QR.
  note: 'สแกน QR เพื่อโอนผ่านแอปธนาคาร แล้วแนบสลิปเพื่อยืนยันการชำระเงิน'
}

export function subscribePayment(onData, onError) {
  const ref = doc(db, 'config', 'payment')
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) onData({ ...defaultPayment, ...snap.data() })
      else onData(defaultPayment)
    },
    (err) => {
      console.warn('[payment] listener error, using default:', err?.message)
      onData(defaultPayment)
      if (onError) onError(err)
    }
  )
}

export async function savePayment(cfg) {
  const payload = {
    promptPayId: sanitizeId(cfg.promptPayId),
    merchantName: (cfg.merchantName || 'ShopHub').trim(),
    enabled: cfg.enabled !== false,
    note: (cfg.note || defaultPayment.note).trim(),
    updatedAt: Date.now()
  }
  await setDoc(doc(db, 'config', 'payment'), payload, { merge: true })
  return payload
}

// Keep only digits (mobile numbers may be entered as 08X-XXX-XXXX etc).
export function sanitizeId(id) {
  return String(id || '').replace(/[^0-9]/g, '')
}

// ---------- EMVCo payload builders ----------

// Formats a single TLV field: 2-digit id + 2-digit length + value.
function tlv(id, value) {
  const len = String(value.length).padStart(2, '0')
  return `${id}${len}${value}`
}

// Normalizes a PromptPay target into the EMVCo account value.
// - 13-digit national/tax ID -> used as-is.
// - Mobile number -> 0066 + number without leading 0 (13 chars total).
// - e-Wallet (15 digits) -> used as-is.
function formatTarget(id) {
  const digits = sanitizeId(id)
  if (digits.length >= 15) return digits
  if (digits.length === 13) return digits
  // Mobile number: strip a leading 0, prefix country code 66, pad to 13.
  const local = digits.replace(/^0/, '')
  return ('0066' + local).padStart(13, '0')
}

// Detects whether the id should use the mobile (01) or ID (02) sub-tag.
function targetTag(id) {
  const digits = sanitizeId(id)
  // 13-digit values that are not a valid mobile are treated as national IDs.
  if (digits.length === 13 || digits.length === 15) return '02'
  return '01'
}

/**
 * Builds a PromptPay EMVCo payload string for the given id and amount.
 * Pass amount = 0/undefined for a static (no-amount) QR.
 */
export function promptPayPayload(id, amount) {
  const cleanAmount = Number(amount)
  const hasAmount = Number.isFinite(cleanAmount) && cleanAmount > 0

  // Merchant Account Information (tag 29) for PromptPay (AID A000000677010111).
  const aid = tlv('00', 'A000000677010111')
  const account = tlv(targetTag(id), formatTarget(id))
  const merchantAccount = tlv('29', aid + account)

  // Field order matches the widely-tested promptpay-qr layout so the QR scans
  // reliably across Thai banking apps.
  const parts = [
    tlv('00', '01'), // payload format indicator
    tlv('01', hasAmount ? '12' : '11'), // 11 = static, 12 = dynamic (with amount)
    merchantAccount,
    tlv('58', 'TH'), // country
    tlv('53', '764') // currency = THB
  ]
  if (hasAmount) parts.push(tlv('54', cleanAmount.toFixed(2)))

  const withoutCrc = parts.join('') + '6304'
  return withoutCrc + crc16(withoutCrc)
}

// CRC-16/CCITT-FALSE checksum (poly 0x1021, init 0xFFFF), uppercase hex.
export function crc16(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}
