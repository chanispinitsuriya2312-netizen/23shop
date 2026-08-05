package com.example.data

import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object GeminiAssistantService {
    private const val MODEL_NAME = "gemini-3.1-pro-preview"
    private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/$MODEL_NAME:generateContent"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    suspend fun generateAssistantResponse(
        userPrompt: String,
        inventory: List<ProductEntity>,
        chatHistory: List<ChatMessageEntity>
    ): String = withContext(Dispatchers.IO) {
        val apiKey = getApiKey()

        if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY" || apiKey == "YOUR_GEMINI_API_KEY") {
            return@withContext fallbackLocalAi(userPrompt, inventory)
        }

        try {
            // Build inventory catalog string
            val catalogText = inventory.joinToString("\n") { p ->
                "- [${p.title}] Price: ฿${p.price}, Stock: ${p.stock} pcs, Category: ${p.category}, Rating: ${p.rating}★. Description: ${p.description}"
            }

            val systemInstructionText = """
                You are ShopHub High-Thinking AI Assistant, a powerful and analytical retail shopping advisor powered by Gemini 3.1 Pro High Thinking.
                
                Current Store Product Inventory Catalog:
                $catalogText
                
                Store Policies:
                - Shipping: 1-2 business days via Kerry Express / Flash Express. Free shipping over ฿500.
                - Discounts: Promo code 'SHOP10' gives 10% off total purchase.
                - Payments: PromptPay QR, Credit/Debit Card, Bank Transfer, COD (Cash on Delivery).
                
                Guidelines:
                1. Deeply analyze user needs, budget constraints, technical specifications, and compatibility before recommending products.
                2. Answer complex queries with detailed breakdown, pros/cons comparison, and clear reasoning.
                3. Refer accurately to products listed above with their exact prices in ฿.
                4. Maintain a warm, expert, and professional advisor tone.
            """.trimIndent()

            val rootObj = JSONObject()

            // Thinking Config in generationConfig
            val thinkingConfigObj = JSONObject().apply {
                put("thinkingLevel", "HIGH")
            }
            val generationConfigObj = JSONObject().apply {
                put("thinkingConfig", thinkingConfigObj)
            }
            rootObj.put("generationConfig", generationConfigObj)

            // System instruction
            val sysInstObj = JSONObject().apply {
                val partsArr = JSONArray().apply {
                    put(JSONObject().put("text", systemInstructionText))
                }
                put("parts", partsArr)
            }
            rootObj.put("systemInstruction", sysInstObj)


            // Contents history
            val contentsArr = JSONArray()
            chatHistory.takeLast(6).forEach { msg ->
                val role = if (msg.sender == "user") "user" else "model"
                val contentObj = JSONObject().apply {
                    put("role", role)
                    put("parts", JSONArray().apply {
                        put(JSONObject().put("text", msg.message))
                    })
                }
                contentsArr.put(contentObj)
            }

            // Current prompt
            contentsArr.put(JSONObject().apply {
                put("role", "user")
                put("parts", JSONArray().apply {
                    put(JSONObject().put("text", userPrompt))
                })
            })

            rootObj.put("contents", contentsArr)

            val requestBody = rootObj.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$BASE_URL?key=$apiKey")
                .post(requestBody)
                .build()

            val response = client.newCall(request).execute()
            val responseString = response.body?.string() ?: ""

            if (response.isSuccessful && responseString.isNotBlank()) {
                val respJson = JSONObject(responseString)
                val text = respJson.optJSONArray("candidates")
                    ?.optJSONObject(0)
                    ?.optJSONObject("content")
                    ?.optJSONArray("parts")
                    ?.optJSONObject(0)
                    ?.optString("text")

                if (!text.isNullOrBlank()) {
                    return@withContext text
                }
            }

            fallbackLocalAi(userPrompt, inventory)
        } catch (e: Exception) {
            e.printStackTrace()
            fallbackLocalAi(userPrompt, inventory)
        }
    }

    private fun getApiKey(): String {
        return try {
            val field = BuildConfig::class.java.getField("GEMINI_API_KEY")
            field.get(null) as? String ?: ""
        } catch (e: Exception) {
            ""
        }
    }

    private fun fallbackLocalAi(userPrompt: String, inventory: List<ProductEntity>): String {
        val lower = userPrompt.lowercase()

        // Match inventory items
        val matchingProducts = inventory.filter { p ->
            lower.contains(p.category.lowercase()) ||
            lower.contains(p.title.lowercase()) ||
            p.description.lowercase().split(" ").any { word -> word.length >= 4 && lower.contains(word) }
        }

        return when {
            matchingProducts.isNotEmpty() -> {
                val itemsList = matchingProducts.take(3).joinToString("\n\n") { p ->
                    "🛍️ **${p.title}**\nPrice: ฿${String.format("%,.0f", p.price)} | Stock: ${p.stock} pcs | Rating: ${p.rating}★\n_${p.description}_"
                }
                "Here are the items matching your search from our inventory:\n\n$itemsList\n\nLet me know if you would like more details or help adding them to your cart!"
            }
            lower.contains("แนะนำ") || lower.contains("recommend") || lower.contains("suggest") || lower.contains("best") -> {
                val topProducts = inventory.sortedByDescending { it.rating }.take(3)
                val recList = topProducts.joinToString("\n") { p ->
                    "• **${p.title}** (${p.category}) — ฿${String.format("%,.0f", p.price)} [Rating: ${p.rating}★]"
                }
                "🌟 **Top Recommended Products in Stock:**\n\n$recList\n\nTell me what category or budget you have in mind!"
            }
            lower.contains("ส่ง") || lower.contains("shipping") || lower.contains("deliver") -> {
                "🚚 **Shipping Information:**\nWe ship all orders via Kerry & Flash Express within 1-2 business days. Free delivery for orders over ฿500!"
            }
            lower.contains("ส่วนลด") || lower.contains("discount") || lower.contains("code") || lower.contains("coupon") -> {
                "🎁 **Current Special Offer:**\nUse coupon code **SHOP10** at checkout to get 10% off your entire order!"
            }
            else -> {
                "Hello! I am your ShopHub AI Assistant. Our store has ${inventory.size} items in stock across ${inventory.map { it.category }.distinct().joinToString(", ")}. How can I help you find the right product today?"
            }
        }
    }
}
