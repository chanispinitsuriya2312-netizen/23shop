package com.example.data

/**
 * Per-product highlight badge. Mirrors the web `lib/badge.js` so a badge set on
 * a product from the website (ขายดี / หมด / ลดราคา / แคมเปญ / โปรจับเวลา) shows up
 * on the app too. Stored on the product as badge { type, text, endsAt }.
 */
data class ProductBadge(
    val type: String = "none",
    val text: String = "",
    val endsAt: Long = 0L
)

/** Visual + label metadata for a badge type (color is 0xAARRGGBB). */
data class BadgeMeta(
    val label: String,
    val emoji: String,
    val color: Long
)

object BadgeLogic {

    val TYPES: Map<String, BadgeMeta> = linkedMapOf(
        "none" to BadgeMeta("ไม่มีป้าย", "", 0xFF9CA3AF),
        "bestseller" to BadgeMeta("ขายดี", "🔥", 0xFFF43F5E),
        "hot" to BadgeMeta("มาแรง", "⚡", 0xFFF97316),
        "new" to BadgeMeta("มาใหม่", "✨", 0xFF0EA5E9),
        "sale" to BadgeMeta("ลดราคา", "🏷️", 0xFFFF5722),
        "soldout" to BadgeMeta("สินค้าหมด", "⛔", 0xFF475569),
        "campaign" to BadgeMeta("แคมเปญ", "🎉", 0xFFDB2777),
        "promo" to BadgeMeta("โปรจับเวลา", "⏰", 0xFF7C3AED)
    )

    fun meta(type: String): BadgeMeta = TYPES[type] ?: TYPES.getValue("none")

    fun usesCountdown(type: String): Boolean = type == "promo"

    /** Reads a badge from a raw Firestore product map. */
    fun fromMap(data: Map<String, Any?>?): ProductBadge {
        val b = data?.get("badge") as? Map<*, *> ?: return ProductBadge()
        return ProductBadge(
            type = (b["type"] as? String)?.takeIf { TYPES.containsKey(it) } ?: "none",
            text = (b["text"] as? String) ?: "",
            endsAt = (b["endsAt"] as? Number)?.toLong() ?: 0L
        )
    }

    /** Whether the badge should currently show (time-boxed promos expire). */
    fun isActive(badge: ProductBadge): Boolean {
        if (badge.type == "none") return false
        return if (usesCountdown(badge.type)) badge.endsAt > System.currentTimeMillis() else true
    }

    /** Text on the pill: admin text if set, else the default label, with emoji. */
    fun label(badge: ProductBadge): String {
        val m = meta(badge.type)
        val text = badge.text.trim().ifBlank { m.label }
        return if (m.emoji.isNotBlank()) "${m.emoji} $text" else text
    }

    /** "1ว 02:03:04" / "02:03:04" / "03:04" for the countdown pill. */
    fun formatCountdown(ms: Long): String {
        if (ms <= 0) return "00:00"
        val totalSec = ms / 1000
        val d = totalSec / 86400
        val h = (totalSec % 86400) / 3600
        val m = (totalSec % 3600) / 60
        val s = totalSec % 60
        fun p(n: Long) = n.toString().padStart(2, '0')
        return when {
            d > 0 -> "${d}ว ${p(h)}:${p(m)}:${p(s)}"
            h > 0 -> "${p(h)}:${p(m)}:${p(s)}"
            else -> "${p(m)}:${p(s)}"
        }
    }
}
