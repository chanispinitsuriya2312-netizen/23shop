package com.example.data

/**
 * Hero banner slideshow model. Mirrors the web `config/hero` Firestore document
 * so the admin can add / remove / reorder the home banner slides for both the
 * website and the app. Each slide has its own title, subtitle, background and
 * optional CTA + image.
 */
data class HeroSlide(
    val title: String = "",
    val subtitle: String = "",
    val bg: String = "",
    val image: String = "",
    val ctaText: String = "",
    val ctaLink: String = ""
) {
    companion object {
        fun fromMap(data: Map<*, *>): HeroSlide = HeroSlide(
            title = data["title"] as? String ?: "",
            subtitle = data["subtitle"] as? String ?: "",
            bg = data["bg"] as? String ?: "",
            image = data["image"] as? String ?: "",
            ctaText = data["ctaText"] as? String ?: "",
            ctaLink = data["ctaLink"] as? String ?: ""
        )
    }
}

data class HeroConfig(
    val slides: List<HeroSlide> = emptyList(),
    val autoPlayMs: Long = 5000L,
    val showFeatured: Boolean = true
) {
    companion object {
        val DEFAULT = HeroConfig(
            slides = listOf(
                HeroSlide(
                    title = "ช้อปสนุก ครบทุกไลฟ์สไตล์",
                    subtitle = "สินค้าคุณภาพคัดสรร ส่งไว ราคาดี",
                    bg = "",
                    ctaText = "",
                    ctaLink = ""
                ),
                HeroSlide(
                    title = "ดีลเด็ดประจำสัปดาห์ ⚡",
                    subtitle = "ลดแรงทุกหมวด เลือกเลยก่อนของหมด",
                    bg = "linear-gradient(135deg, #4f46e5, #db2777)",
                    ctaText = "ดูโปรโมชั่น",
                    ctaLink = "/"
                ),
                HeroSlide(
                    title = "สมัครสมาชิกวันนี้ 🎁",
                    subtitle = "รับสิทธิพิเศษ + สะสมแต้ม เติมเงินเข้ากระเป๋าง่าย ๆ",
                    bg = "linear-gradient(135deg, #0ea5e9, #10b981)",
                    ctaText = "สมัครเลย",
                    ctaLink = "/account/register"
                )
            )
        )

        fun fromMap(data: Map<String, Any?>?): HeroConfig {
            if (data == null) return DEFAULT
            val slides = (data["slides"] as? List<*>)
                ?.mapNotNull { (it as? Map<*, *>)?.let { m -> HeroSlide.fromMap(m) } }
                ?.filter { it.title.isNotBlank() || it.subtitle.isNotBlank() || it.image.isNotBlank() }
                ?: emptyList()
            return HeroConfig(
                slides = slides.ifEmpty { DEFAULT.slides },
                autoPlayMs = (data["autoPlayMs"] as? Number)?.toLong()?.coerceAtLeast(0L) ?: DEFAULT.autoPlayMs,
                showFeatured = data["showFeatured"] as? Boolean ?: DEFAULT.showFeatured
            )
        }
    }
}
