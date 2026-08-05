package com.example.data

/**
 * Discount campaign / flash-sale model. Mirrors the web `config/campaign`
 * Firestore document so the Android app and website share one campaign.
 *
 * scope:        "cart" = ลดทั้งตะกร้า | "products" = เฉพาะสินค้าที่เลือก (ลดเป็นชิ้น/เลหลัง)
 * discountType: "percent" = ลด % | "amount" = ลดเป็นจำนวนเงินต่อชิ้น
 */
data class Campaign(
    val id: String = "launch-sale",
    val active: Boolean = true,
    val title: String = "ฉลองเปิดร้าน ⚡ Flash Sale",
    val subtitle: String = "ลดสูงสุดทั้งร้าน ใช้โค้ดส่วนลดที่ช่องชำระเงิน",
    val promoCode: String = "SHOPHUB10",
    val scope: String = "cart",
    val discountType: String = "percent",
    val discountPercent: Int = 10,
    val discountAmountPerItem: Double = 0.0,
    val productIds: List<Long> = emptyList(),
    val minSpend: Double = 0.0,
    val maxDiscount: Double = 500.0,
    val endsAt: Long = System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000,
    val ctaText: String = "ช้อปเลย",
    val accent: String = "#4f46e5"
) {
    companion object {
        val DEFAULT = Campaign()

        /** Builds a [Campaign] from a raw Firestore document map, using defaults for missing keys. */
        fun fromMap(data: Map<String, Any?>?): Campaign {
            if (data == null) return DEFAULT
            fun num(key: String, def: Double) = (data[key] as? Number)?.toDouble() ?: def
            @Suppress("UNCHECKED_CAST")
            val ids = (data["productIds"] as? List<*>)?.mapNotNull {
                (it as? Number)?.toLong()
            } ?: emptyList()
            return Campaign(
                id = data["id"] as? String ?: DEFAULT.id,
                active = data["active"] as? Boolean ?: DEFAULT.active,
                title = data["title"] as? String ?: DEFAULT.title,
                subtitle = data["subtitle"] as? String ?: DEFAULT.subtitle,
                promoCode = (data["promoCode"] as? String ?: DEFAULT.promoCode).uppercase(),
                scope = if (data["scope"] as? String == "products") "products" else "cart",
                discountType = if (data["discountType"] as? String == "amount") "amount" else "percent",
                discountPercent = num("discountPercent", DEFAULT.discountPercent.toDouble()).toInt(),
                discountAmountPerItem = num("discountAmountPerItem", 0.0),
                productIds = ids,
                minSpend = num("minSpend", 0.0),
                maxDiscount = num("maxDiscount", DEFAULT.maxDiscount),
                endsAt = (data["endsAt"] as? Number)?.toLong() ?: DEFAULT.endsAt,
                ctaText = data["ctaText"] as? String ?: DEFAULT.ctaText,
                accent = data["accent"] as? String ?: DEFAULT.accent
            )
        }
    }
}

/** Result of validating a promo code against a campaign for a given cart. */
data class PromoResult(
    val ok: Boolean = false,
    val amount: Double = 0.0,
    val message: String = "",
    val label: String = ""
)

/** Remaining-time breakdown for the countdown clock. */
data class Countdown(
    val days: Long,
    val hours: Long,
    val minutes: Long,
    val seconds: Long,
    val done: Boolean
)

/** Shared campaign business logic (parallels web `lib/campaign.js`). */
object CampaignLogic {

    private fun hasValue(c: Campaign): Boolean =
        if (c.discountType == "amount") c.discountAmountPerItem > 0 else c.discountPercent > 0

    fun isLive(c: Campaign): Boolean =
        c.active && c.endsAt > System.currentTimeMillis() && hasValue(c)

    fun isProductInCampaign(c: Campaign, productId: Long): Boolean =
        isLive(c) && c.scope == "products" && c.productIds.contains(productId)

    /** Discount for a single cart line under a product-scoped campaign (0 if n/a). */
    fun lineDiscount(c: Campaign, price: Double, quantity: Int, productId: Long): Double {
        if (!isProductInCampaign(c, productId)) return 0.0
        val line = price * quantity
        return if (c.discountType == "amount") {
            minOf(c.discountAmountPerItem * quantity, line)
        } else {
            (line * c.discountPercent / 100.0)
        }
    }

    /** Label shown on a product card, e.g. "ลด 10%" or "ลด 50฿/ชิ้น". */
    fun productBadgeLabel(c: Campaign): String =
        if (c.discountType == "amount") "ลด ${String.format("%,.0f", c.discountAmountPerItem)}฿/ชิ้น"
        else "ลด ${c.discountPercent}%"

    /**
     * Validates [code] against [campaign] and computes the discount for [items].
     * - scope "cart": percentage off the whole subtotal.
     * - scope "products": per-piece / clearance discount on eligible items only.
     */
    fun applyPromo(code: String, campaign: Campaign, items: List<CartItemWithProduct>): PromoResult {
        val input = code.trim().uppercase()
        if (input.isEmpty()) return PromoResult(false, 0.0, "", "")
        if (!isLive(campaign)) return PromoResult(false, 0.0, "แคมเปญนี้สิ้นสุดแล้ว", "")
        if (input != campaign.promoCode.uppercase()) {
            return PromoResult(false, 0.0, "โค้ดส่วนลดไม่ถูกต้อง", "")
        }
        val subtotal = items.sumOf { (it.product?.price ?: 0.0) * it.quantity }
        if (subtotal < campaign.minSpend) {
            return PromoResult(false, 0.0, "ยอดขั้นต่ำ ${String.format("%,.0f", campaign.minSpend)} บาท", "")
        }

        var amount: Double
        if (campaign.scope == "products") {
            val eligible = items.filter { campaign.productIds.contains(it.productId) }
            if (eligible.isEmpty()) {
                return PromoResult(false, 0.0, "ไม่มีสินค้าร่วมรายการในตะกร้า", "")
            }
            amount = eligible.sumOf {
                lineDiscount(campaign, it.product?.price ?: 0.0, it.quantity, it.productId)
            }
            if (campaign.maxDiscount > 0) amount = minOf(amount, campaign.maxDiscount)
            return PromoResult(
                ok = true,
                amount = amount,
                message = "ใช้โค้ด $input ลด ${String.format("%,.0f", amount)} บาท (เฉพาะสินค้าร่วมรายการ)",
                label = "ส่วนลด ($input)"
            )
        }

        amount = subtotal * campaign.discountPercent / 100.0
        if (campaign.maxDiscount > 0) amount = minOf(amount, campaign.maxDiscount)
        return PromoResult(
            ok = true,
            amount = amount,
            message = "ใช้โค้ด $input ลด ${String.format("%,.0f", amount)} บาท",
            label = "ส่วนลด ($input ${campaign.discountPercent}%)"
        )
    }

    fun countdown(remainingMs: Long): Countdown {
        val ms = maxOf(0L, remainingMs)
        val day = 24L * 60 * 60 * 1000
        return Countdown(
            days = ms / day,
            hours = (ms % day) / (60 * 60 * 1000),
            minutes = (ms % (60 * 60 * 1000)) / (60 * 1000),
            seconds = (ms % (60 * 1000)) / 1000,
            done = ms <= 0
        )
    }
}
