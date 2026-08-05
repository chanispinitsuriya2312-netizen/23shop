package com.example.data

/**
 * ศูนย์ข่าวสาร / แจ้งเตือน (News Center).
 *
 * Mirrors the web `news` Firestore collection so the Android app shows the SAME
 * announcements the admin manages on the website (NewsCenter.jsx / lib/news.js).
 *
 *   title       หัวข้อ
 *   shortDesc   คำอธิบายสั้น (โชว์ 2 บรรทัดในการ์ด)
 *   body        เนื้อหาเต็ม (หน้ารายละเอียด)
 *   imageUrl    รูป 4:3
 *   category    หมวด: promotion | system | general
 *   productId   (ไม่บังคับ) ผูกกับสินค้า เพื่อทำปุ่ม "ดูสินค้า"
 *   active      เปิด/ปิด (ปิดไว้ = ไม่โชว์ แต่ยังไม่ลบ)
 *   order       ลำดับการแสดง (มากขึ้นก่อน)
 *
 * อ่านอย่างเดียวจากฝั่งแอป (แอดมินเขียนผ่านเว็บ). สถานะ "อ่านแล้ว" เก็บที่เครื่อง
 * ผู้ใช้เอง (SharedPreferences) ไม่เก็บใน Firestore จึงไม่แสดงวันที่/วันหมดอายุ
 * ตามที่ผู้ใช้ต้องการ.
 */
data class News(
    val id: String = "",
    val title: String = "",
    val shortDesc: String = "",
    val body: String = "",
    val imageUrl: String = "",
    val category: String = "general",
    val productId: String = "",
    val active: Boolean = true,
    val order: Int = 0,
    val createdAt: Long = 0L
) {
    companion object {
        /** Builds a [News] from a raw Firestore document map + doc id. */
        fun fromMap(id: String, data: Map<String, Any?>?): News? {
            if (data == null) return null
            fun str(key: String) = (data[key] as? String)?.trim() ?: ""
            val cat = str("category").ifBlank { "general" }
            return News(
                id = id,
                title = str("title"),
                shortDesc = str("shortDesc"),
                body = str("body"),
                imageUrl = str("imageUrl"),
                category = if (NewsCategories.keys.contains(cat)) cat else "general",
                productId = str("productId"),
                active = data["active"] as? Boolean ?: true,
                order = (data["order"] as? Number)?.toInt() ?: 0,
                createdAt = (data["createdAt"] as? Number)?.toLong() ?: 0L
            )
        }
    }
}

/** หมวดข่าว + ป้ายภาษาไทย (ให้ตรงกับเว็บ NEWS_CATEGORIES). */
data class NewsCategory(val key: String, val label: String)

object NewsCategories {
    val ALL: List<NewsCategory> = listOf(
        NewsCategory("promotion", "โปรโมชั่น"),
        NewsCategory("system", "ระบบ"),
        NewsCategory("general", "ทั่วไป")
    )

    val keys: Set<String> = ALL.map { it.key }.toSet()

    fun label(key: String): String =
        ALL.firstOrNull { it.key == key }?.label ?: "ทั่วไป"

    /** เฉพาะหมวดที่มีข่าว active อยู่จริง เพื่อสร้างแท็บแบบ dynamic เหมือนเว็บ. */
    fun present(items: List<News>): List<NewsCategory> {
        val used = items.map { it.category }.toSet()
        return ALL.filter { used.contains(it.key) }
    }
}
