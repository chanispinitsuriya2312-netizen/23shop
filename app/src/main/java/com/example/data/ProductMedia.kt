package com.example.data

import org.json.JSONArray
import org.json.JSONObject

/**
 * A single media item in a product's catalog gallery (image or video) with an
 * optional caption. Mirrors the web model `{ type, url, caption }`.
 */
data class ProductMedia(
    val type: String, // "image" or "video"
    val url: String,
    val caption: String = ""
) {
    val isVideo: Boolean get() = type.equals("video", ignoreCase = true)

    /** YouTube embed/watch id if this is a YouTube URL, else null. */
    val youTubeId: String?
        get() {
            val m = YOUTUBE_REGEX.find(url) ?: return null
            return m.groupValues.getOrNull(1)?.takeIf { it.isNotBlank() }
        }

    companion object {
        private val YOUTUBE_REGEX =
            Regex("""(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})""")

        /**
         * Parses a product's [mediaJson] into a list of [ProductMedia].
         * Falls back to a single image built from [imageUrl] when the JSON is
         * empty/invalid, preserving backward compatibility with legacy products.
         */
        fun parse(mediaJson: String, imageUrl: String): List<ProductMedia> {
            val list = mutableListOf<ProductMedia>()
            if (mediaJson.isNotBlank()) {
                runCatching {
                    val arr = JSONArray(mediaJson)
                    for (i in 0 until arr.length()) {
                        val o = arr.optJSONObject(i) ?: continue
                        val url = o.optString("url").trim()
                        if (url.isEmpty()) continue
                        list.add(
                            ProductMedia(
                                type = o.optString("type", "image").ifBlank { "image" },
                                url = url,
                                caption = o.optString("caption", "")
                            )
                        )
                    }
                }
            }
            if (list.isEmpty() && imageUrl.isNotBlank()) {
                list.add(ProductMedia(type = "image", url = imageUrl, caption = ""))
            }
            return list
        }

        /** Serializes a list of media into the JSON string stored in Room/Firestore. */
        fun toJson(media: List<ProductMedia>): String {
            if (media.isEmpty()) return ""
            val arr = JSONArray()
            for (m in media) {
                if (m.url.isBlank()) continue
                arr.put(
                    JSONObject()
                        .put("type", if (m.isVideo) "video" else "image")
                        .put("url", m.url)
                        .put("caption", m.caption)
                )
            }
            return if (arr.length() == 0) "" else arr.toString()
        }

        /** Builds a JSON string from a Firestore-deserialized list of maps. */
        fun jsonFromFirestore(media: List<Map<String, Any?>>): String {
            if (media.isEmpty()) return ""
            val arr = JSONArray()
            for (m in media) {
                val url = (m["url"] as? String)?.trim().orEmpty()
                if (url.isEmpty()) continue
                arr.put(
                    JSONObject()
                        .put("type", (m["type"] as? String)?.ifBlank { "image" } ?: "image")
                        .put("url", url)
                        .put("caption", (m["caption"] as? String) ?: "")
                )
            }
            return if (arr.length() == 0) "" else arr.toString()
        }
    }
}
