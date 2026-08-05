package com.example.data

/**
 * Store theme / branding model. Mirrors the web `config/theme` Firestore
 * document so the admin can rebrand BOTH the website and the app from one place
 * (brand name, logo letter, primary colour, day/night default) — no re-upload.
 */
data class ThemeConfig(
    val brandName: String = "ShopHub",
    val logoText: String = "S",
    val logoUrl: String = "",
    val primaryColor: String = "#ff5722",
    val darkModeDefault: Boolean = false,
    val allowUserToggle: Boolean = true,
    val lineEnabled: Boolean = false,
    val lineUrl: String = "",
    val codEnabled: Boolean = true,
    val newsEnabled: Boolean = true,
    val newsPosition: String = "bottom-right"
) {
    companion object {
        val DEFAULT = ThemeConfig()

        fun fromMap(data: Map<String, Any?>?): ThemeConfig {
            if (data == null) return DEFAULT
            fun str(key: String, def: String) = (data[key] as? String)?.takeIf { it.isNotBlank() } ?: def
            return ThemeConfig(
                brandName = str("brandName", DEFAULT.brandName),
                logoText = str("logoText", DEFAULT.logoText),
                logoUrl = data["logoUrl"] as? String ?: DEFAULT.logoUrl,
                primaryColor = str("primaryColor", DEFAULT.primaryColor),
                darkModeDefault = data["darkModeDefault"] as? Boolean ?: DEFAULT.darkModeDefault,
                allowUserToggle = data["allowUserToggle"] as? Boolean ?: DEFAULT.allowUserToggle,
                lineEnabled = data["lineEnabled"] as? Boolean ?: DEFAULT.lineEnabled,
                lineUrl = data["lineUrl"] as? String ?: DEFAULT.lineUrl,
                codEnabled = data["codEnabled"] as? Boolean ?: DEFAULT.codEnabled,
                newsEnabled = data["newsEnabled"] as? Boolean ?: DEFAULT.newsEnabled,
                newsPosition = if (data["newsPosition"] as? String == "top-right") "top-right" else "bottom-right"
            )
        }
    }
}
