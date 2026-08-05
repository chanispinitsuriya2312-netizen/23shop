package com.example.data

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

/**
 * PromptPay payment config. Mirrors the web `config/payment` Firestore document
 * so the Android app and website share one PromptPay account. Editable from the
 * web admin dashboard; the app reads it live and generates the QR client-side
 * (no gateway, no server, ฿0).
 */
data class PaymentConfig(
    val promptPayId: String = "0000000000",
    val merchantName: String = "ShopHub",
    val enabled: Boolean = true,
    val note: String = "สแกน QR เพื่อโอนผ่านแอปธนาคาร แล้วแนบสลิปเพื่อยืนยันการชำระเงิน"
) {
    companion object {
        val DEFAULT = PaymentConfig()

        fun fromMap(data: Map<String, Any?>?): PaymentConfig {
            if (data == null) return DEFAULT
            return PaymentConfig(
                promptPayId = data["promptPayId"] as? String ?: DEFAULT.promptPayId,
                merchantName = data["merchantName"] as? String ?: DEFAULT.merchantName,
                enabled = data["enabled"] as? Boolean ?: DEFAULT.enabled,
                note = data["note"] as? String ?: DEFAULT.note
            )
        }
    }
}

/**
 * Generates PromptPay EMVCo QR payloads. Byte-for-byte compatible with the web
 * `promptpay.js` implementation and the reference `promptpay-qr` library, so a
 * QR built here scans correctly in Thai banking apps.
 */
object PromptPay {

    /** Keeps only digits (mobile numbers may be entered as 08X-XXX-XXXX). */
    fun sanitizeId(id: String?): String = (id ?: "").filter { it.isDigit() }

    private fun tlv(id: String, value: String): String {
        val len = value.length.toString().padStart(2, '0')
        return "$id$len$value"
    }

    private fun formatTarget(id: String): String {
        val digits = sanitizeId(id)
        if (digits.length >= 15) return digits
        if (digits.length == 13) return digits
        val local = digits.removePrefix("0")
        return ("0066$local").padStart(13, '0')
    }

    private fun targetTag(id: String): String {
        val digits = sanitizeId(id)
        return if (digits.length == 13 || digits.length == 15) "02" else "01"
    }

    /**
     * Builds a PromptPay payload string for the given id and amount.
     * Pass amount <= 0 for a static (no-amount) QR.
     */
    fun payload(id: String?, amount: Double): String {
        val hasAmount = amount.isFinite() && amount > 0.0

        val aid = tlv("00", "A000000677010111")
        val account = tlv(targetTag(id ?: ""), formatTarget(id ?: ""))
        val merchantAccount = tlv("29", aid + account)

        val parts = mutableListOf(
            tlv("00", "01"),
            tlv("01", if (hasAmount) "12" else "11"),
            merchantAccount,
            tlv("58", "TH"),
            tlv("53", "764")
        )
        if (hasAmount) parts.add(tlv("54", String.format("%.2f", amount)))

        val withoutCrc = parts.joinToString("") + "6304"
        return withoutCrc + crc16(withoutCrc)
    }

    /** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), uppercase hex. */
    fun crc16(str: String): String {
        var crc = 0xFFFF
        for (c in str) {
            crc = crc xor (c.code shl 8)
            repeat(8) {
                crc = if (crc and 0x8000 != 0) (crc shl 1) xor 0x1021 else crc shl 1
                crc = crc and 0xFFFF
            }
        }
        return crc.toString(16).uppercase().padStart(4, '0')
    }

    /** Renders a payload string into a black-and-white QR [Bitmap]. */
    fun qrBitmap(content: String, size: Int = 640): Bitmap {
        val hints = mapOf(
            EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            EncodeHintType.MARGIN to 1
        )
        val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size, hints)
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
        for (x in 0 until size) {
            for (y in 0 until size) {
                bmp.setPixel(x, y, if (matrix.get(x, y)) Color.BLACK else Color.WHITE)
            }
        }
        return bmp
    }
}
