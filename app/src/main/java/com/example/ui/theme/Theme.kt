package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance

/** Parses a #rrggbb / #rgb hex string to a Compose [Color], or [fallback] if invalid. */
fun parseHexColor(hex: String?, fallback: Color): Color {
    val h = hex?.trim()?.removePrefix("#") ?: return fallback
    val full = when (h.length) {
        3 -> h.map { "$it$it" }.joinToString("")
        6 -> h
        else -> return fallback
    }
    return try {
        val n = full.toLong(16)
        Color(
            red = ((n shr 16) and 0xFF) / 255f,
            green = ((n shr 8) and 0xFF) / 255f,
            blue = (n and 0xFF) / 255f,
            alpha = 1f
        )
    } catch (e: Exception) {
        fallback
    }
}

/** Lighten/darken a colour by [fraction] (positive = lighter, negative = darker). */
fun Color.shade(fraction: Float): Color {
    return if (fraction >= 0f) {
        Color(
            red = red + (1f - red) * fraction,
            green = green + (1f - green) * fraction,
            blue = blue + (1f - blue) * fraction,
            alpha = alpha
        )
    } else {
        val f = 1f + fraction
        Color(red = red * f, green = green * f, blue = blue * f, alpha = alpha)
    }
}

@Composable
fun ShopHubTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    primaryColorHex: String? = null,
    content: @Composable () -> Unit
) {
    val primary = parseHexColor(primaryColorHex, ShopPrimary)
    // Ensure the CTA text stays readable on the chosen brand colour.
    val onPrimary = if (primary.luminance() > 0.55f) Color(0xFF1E1E24) else Color.White

    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = primary,
            secondary = primary.shade(0.2f),
            tertiary = ShopTertiary,
            background = ShopDarkBackground,
            surface = ShopDarkSurface,
            onPrimary = onPrimary,
            primaryContainer = primary.shade(-0.35f),
            onPrimaryContainer = primary.shade(0.6f)
        )
    } else {
        lightColorScheme(
            primary = primary,
            secondary = primary.shade(0.15f),
            tertiary = ShopTertiary,
            background = ShopBackgroundLight,
            surface = ShopSurfaceLight,
            onPrimary = onPrimary,
            primaryContainer = primary.shade(0.85f),
            onPrimaryContainer = primary.shade(-0.2f)
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
