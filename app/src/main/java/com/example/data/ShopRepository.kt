package com.example.data

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.combine

class ShopRepository(private val dao: ShopDao) {

    val allProducts: Flow<List<ProductEntity>> = dao.getAllProducts()

    val cartItems: Flow<List<CartItemEntity>> = dao.getCartItems()

    val cartWithProducts: Flow<List<CartItemWithProduct>> = combine(cartItems, allProducts) { items, products ->
        val productMap = products.associateBy { it.id }
        items.map { cartItem ->
            CartItemWithProduct(
                productId = cartItem.productId,
                quantity = cartItem.quantity,
                product = productMap[cartItem.productId]
            )
        }
    }

    val allOrders: Flow<List<OrderEntity>> = dao.getAllOrders()

    val chatMessages: Flow<List<ChatMessageEntity>> = dao.getAllChatMessages()

    suspend fun getProductById(id: Long): ProductEntity? = dao.getProductById(id)

    suspend fun insertOrUpdateProduct(product: ProductEntity): Long {
        return if (product.id == 0L) {
            dao.insertProduct(product)
        } else {
            dao.updateProduct(product)
            product.id
        }
    }

    suspend fun deleteProduct(id: Long) {
        dao.deleteProduct(id)
        dao.deleteCartItem(id)
    }

    suspend fun addToCart(productId: Long, quantityToAdd: Int = 1) {
        val existingItem = dao.getCartItems() // or query directly
        // We can safely handle cart addition
        val currentItems = dao.getCartItems()
        // Wait, let's query cart directly or use simple flow snapshot
    }

    suspend fun updateCartQuantity(productId: Long, quantity: Int) {
        if (quantity <= 0) {
            dao.deleteCartItem(productId)
        } else {
            dao.insertOrUpdateCartItem(CartItemEntity(productId = productId, quantity = quantity))
        }
    }

    suspend fun removeFromCart(productId: Long) {
        dao.deleteCartItem(productId)
    }

    suspend fun clearCart() {
        dao.clearCart()
    }

    suspend fun placeOrderWithFirestore(
        customerName: String,
        customerPhone: String,
        shippingAddress: String,
        paymentMethod: String,
        items: List<CartItemWithProduct>,
        subtotal: Double,
        tax: Double,
        shippingFee: Double,
        discountAmount: Double,
        totalAmount: Double,
        promoCode: String = ""
    ): String {
        val randomNum = (10000..99999).random()
        val orderCode = "SH-$randomNum"
        val itemsSummary = items.joinToString(", ") { item ->
            "${item.product?.title ?: "Item"} x${item.quantity}"
        }

        // 1. Save to Room local database
        val order = OrderEntity(
            orderCode = orderCode,
            customerName = customerName,
            customerPhone = customerPhone,
            shippingAddress = shippingAddress,
            paymentMethod = paymentMethod,
            totalAmount = totalAmount,
            status = "Order Placed",
            itemsSummary = itemsSummary
        )
        dao.insertOrder(order)
        dao.clearCart()

        // 2. Save purchase data to Google Cloud Firestore
        try {
            val firestore = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val orderMap = hashMapOf(
                "orderCode" to orderCode,
                "customerName" to customerName,
                "customerPhone" to customerPhone,
                "shippingAddress" to shippingAddress,
                "paymentMethod" to paymentMethod,
                "subtotal" to subtotal,
                "tax" to tax,
                "shippingFee" to shippingFee,
                "discountAmount" to discountAmount,
                "promoCode" to promoCode,
                "totalAmount" to totalAmount,
                "status" to "Order Placed",
                // PromptPay = unpaid until a slip is attached; else cash on delivery.
                "paymentStatus" to if (paymentMethod.contains("PromptPay")) "unpaid" else "cod",
                "slipDataUrl" to "",
                "createdAt" to System.currentTimeMillis(),
                "items" to items.map { item ->
                    hashMapOf(
                        "productId" to item.productId,
                        "title" to (item.product?.title ?: ""),
                        "price" to (item.product?.price ?: 0.0),
                        "quantity" to item.quantity,
                        "imageUrl" to (item.product?.imageUrl ?: "")
                    )
                }
            )
            firestore.collection("orders")
                .document(orderCode)
                .set(orderMap)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // 3. Send automated store confirmation message
        dao.insertChatMessage(
            ChatMessageEntity(
                sender = "store",
                message = "Order #$orderCode received! Thank you $customerName. We are preparing your items for shipment. 🙏"
            )
        )

        return orderCode
    }

    suspend fun placeOrder(
        customerName: String,
        customerPhone: String,
        shippingAddress: String,
        paymentMethod: String,
        totalAmount: Double,
        itemsSummary: String
    ): Long {
        val randomNum = (10000..99999).random()
        val orderCode = "SH-$randomNum"
        val order = OrderEntity(
            orderCode = orderCode,
            customerName = customerName,
            customerPhone = customerPhone,
            shippingAddress = shippingAddress,
            paymentMethod = paymentMethod,
            totalAmount = totalAmount,
            status = "กำลังเตรียมจัดส่ง",
            itemsSummary = itemsSummary
        )
        val orderId = dao.insertOrder(order)
        dao.clearCart()

        // Auto message to chat
        dao.insertChatMessage(
            ChatMessageEntity(
                sender = "store",
                message = "ได้รับคำสั่งซื้อรหัส #$orderCode เรียบร้อยแล้วครับ! ทางร้านกำลังเร่งเตรียมจัดส่งสินค้าให้คุณ $customerName ขอบคุณที่อุดหนุนครับ 🙏"
            )
        )
        return orderId
    }

    suspend fun getOrderById(orderId: Long): OrderEntity? = dao.getOrderById(orderId)

    suspend fun updateOrderStatus(orderId: Long, newStatus: String) {
        dao.updateOrderStatus(orderId, newStatus)
    }

    fun getFirestoreOrdersFlow(): Flow<List<FirestoreOrder>> = callbackFlow {
        val firestore = try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            // Firebase not configured (e.g. missing google-services.json). Degrade gracefully.
            e.printStackTrace()
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val listener = firestore.collection("orders")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }

                val ordersList = snapshot?.documents?.mapNotNull { doc ->
                    parseFirestoreOrder(doc.id, doc.data)
                }?.sortedByDescending { it.createdAt } ?: emptyList()

                trySend(ordersList)
            }

        awaitClose { listener.remove() }
    }

    /**
     * Live campaign flow from Firestore `config/campaign`. Falls back to
     * [Campaign.DEFAULT] when Firebase is unavailable or the doc is missing,
     * so the flash-sale UI always has something to show.
     */
    fun getCampaignFlow(): Flow<Campaign> = callbackFlow {
        val firestore = try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            e.printStackTrace()
            trySend(Campaign.DEFAULT)
            close()
            return@callbackFlow
        }
        val listener = firestore.collection("config")
            .document("campaign")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Campaign.DEFAULT)
                    return@addSnapshotListener
                }
                val data = snapshot?.data
                trySend(if (data != null) Campaign.fromMap(data) else Campaign.DEFAULT)
            }

        awaitClose { listener.remove() }
    }

    /**
     * Live store theme / branding from Firestore `config/theme`. Falls back to
     * [ThemeConfig.DEFAULT] so the app always has brand colours to render.
     */
    fun getThemeFlow(): Flow<ThemeConfig> = callbackFlow {
        val firestore = try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            e.printStackTrace()
            trySend(ThemeConfig.DEFAULT)
            close()
            return@callbackFlow
        }
        val listener = firestore.collection("config")
            .document("theme")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(ThemeConfig.DEFAULT)
                    return@addSnapshotListener
                }
                val data = snapshot?.data
                trySend(if (data != null) ThemeConfig.fromMap(data) else ThemeConfig.DEFAULT)
            }
        awaitClose { listener.remove() }
    }

    /**
     * Live hero-banner slides from Firestore `config/hero`. Falls back to
     * [HeroConfig.DEFAULT] so the storefront always has a banner to show.
     */
    fun getHeroFlow(): Flow<HeroConfig> = callbackFlow {
        val firestore = try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            e.printStackTrace()
            trySend(HeroConfig.DEFAULT)
            close()
            return@callbackFlow
        }
        val listener = firestore.collection("config")
            .document("hero")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(HeroConfig.DEFAULT)
                    return@addSnapshotListener
                }
                val data = snapshot?.data
                trySend(if (data != null) HeroConfig.fromMap(data) else HeroConfig.DEFAULT)
            }
        awaitClose { listener.remove() }
    }

    /**
     * Live news / announcements from Firestore `news` (ศูนย์ข่าวสาร). This is the
     * SAME collection the web admin manages, so a post created on the website shows
     * up in the app widget too. Emits only ACTIVE items sorted by `order` desc then
     * `createdAt` desc (done in-memory so no composite index is required). Emits an
     * empty list when Firebase is unavailable — the widget simply hides.
     */
    fun getNewsFlow(): Flow<List<News>> = callbackFlow {
        val firestore = try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            e.printStackTrace()
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val listener = firestore.collection("news")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snapshot?.documents
                    ?.mapNotNull { News.fromMap(it.id, it.data) }
                    ?.filter { it.active }
                    ?.sortedWith(
                        compareByDescending<News> { it.order }.thenByDescending { it.createdAt }
                    )
                    ?: emptyList()
                trySend(list)
            }

        awaitClose { listener.remove() }
    }

    /**
     * Live product catalog from Firestore `products`. This is the SAME collection
     * the web admin writes to, so uploading/editing a product on the website is
     * reflected here. Emits a list of [ProductEntity] mapped from the shared
     * Firestore schema (title/price/category/...). Emits an empty list when
     * Firebase is unavailable so [syncProductsToRoom] can keep the local cache.
     */
    fun getFirestoreProductsFlow(): Flow<List<ProductEntity>> = callbackFlow {
        val firestore = try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            e.printStackTrace()
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val listener = firestore.collection("products")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snapshot?.documents
                    ?.mapNotNull { mapDocToProductEntity(it.id, it.data) }
                    ?: emptyList()
                trySend(list)
            }

        awaitClose { listener.remove() }
    }

    /**
     * Mirrors the shared Firestore catalog into the local Room `products` table
     * so the Room-backed storefront reflects what the web admin has published.
     * Products removed on the web are removed locally too. Skips the reconcile
     * when [products] is empty (offline / not yet loaded) to avoid wiping the
     * local cache.
     */
    suspend fun syncProductsToRoom(products: List<ProductEntity>) {
        if (products.isEmpty()) return
        val incomingIds = products.map { it.id }.toSet()
        for (p in products) dao.insertProduct(p)
        val existingIds = dao.getAllProductIds().toSet()
        for (id in existingIds - incomingIds) {
            dao.deleteProduct(id)
            dao.deleteCartItem(id)
        }
    }

    /** Maps a shared-schema Firestore product document to a Room [ProductEntity]. */
    private fun mapDocToProductEntity(docId: String, data: Map<String, Any>?): ProductEntity? {
        if (data == null) return null
        val title = (data["title"] as? String)?.takeIf { it.isNotBlank() }
            ?: (data["name"] as? String)?.takeIf { it.isNotBlank() }
            ?: return null
        @Suppress("UNCHECKED_CAST")
        val media = (data["media"] as? List<Map<String, Any?>>) ?: emptyList()
        val productIdField = (data["productId"] as? Number)?.toLong() ?: 0L
        val stableId = if (productIdField != 0L) productIdField
            else (docId.hashCode().toLong() and 0x7FFFFFFFL)
        return ProductEntity(
            id = stableId,
            title = title,
            price = (data["price"] as? Number)?.toDouble() ?: 0.0,
            originalPrice = (data["originalPrice"] as? Number)?.toDouble() ?: 0.0,
            category = data["category"] as? String ?: "",
            description = data["description"] as? String ?: "",
            imageUrl = data["imageUrl"] as? String ?: "",
            mediaJson = ProductMedia.jsonFromFirestore(media),
            stock = (data["stock"] as? Number)?.toInt() ?: 0,
            rating = (data["rating"] as? Number)?.toFloat() ?: 4.8f,
            salesCount = (data["salesCount"] as? Number)?.toInt() ?: 0,
            isFeatured = data["isFeatured"] as? Boolean ?: false,
            badgeType = BadgeLogic.fromMap(data).type,
            badgeText = BadgeLogic.fromMap(data).text,
            badgeEndsAt = BadgeLogic.fromMap(data).endsAt,
            createdAt = (data["createdAt"] as? Number)?.toLong() ?: System.currentTimeMillis()
        )
    }

    /**
     * Live PromptPay payment config from Firestore `config/payment`. Falls back
     * to [PaymentConfig.DEFAULT] so checkout always has a QR to show.
     */
    fun getPaymentFlow(): Flow<PaymentConfig> = callbackFlow {
        val firestore = try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            e.printStackTrace()
            trySend(PaymentConfig.DEFAULT)
            close()
            return@callbackFlow
        }
        val listener = firestore.collection("config")
            .document("payment")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(PaymentConfig.DEFAULT)
                    return@addSnapshotListener
                }
                val data = snapshot?.data
                trySend(if (data != null) PaymentConfig.fromMap(data) else PaymentConfig.DEFAULT)
            }

        awaitClose { listener.remove() }
    }

    /**
     * Attaches a compressed payment-slip image (base64 data URL) to an order and
     * marks it as awaiting admin review. Stored inline in Firestore to stay ฿0.
     */
    suspend fun attachOrderSlip(orderCode: String, slipDataUrl: String) {
        try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
                .collection("orders")
                .document(orderCode)
                .update(
                    mapOf(
                        "slipDataUrl" to slipDataUrl,
                        "paymentStatus" to "pending_review",
                        "updatedAt" to System.currentTimeMillis()
                    )
                )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun parseFirestoreOrder(id: String, data: Map<String, Any>?): FirestoreOrder? {
        if (data == null) return null
        return try {
            val itemsData = data["items"] as? List<Map<String, Any>> ?: emptyList()
            val itemsList = itemsData.map { itemMap ->
                FirestoreOrderItem(
                    productId = (itemMap["productId"] as? Number)?.toLong() ?: 0L,
                    title = itemMap["title"] as? String ?: "",
                    price = (itemMap["price"] as? Number)?.toDouble() ?: 0.0,
                    quantity = (itemMap["quantity"] as? Number)?.toInt() ?: 1,
                    imageUrl = itemMap["imageUrl"] as? String ?: ""
                )
            }

            FirestoreOrder(
                orderCode = data["orderCode"] as? String ?: id,
                customerName = data["customerName"] as? String ?: "",
                customerPhone = data["customerPhone"] as? String ?: "",
                shippingAddress = data["shippingAddress"] as? String ?: "",
                paymentMethod = data["paymentMethod"] as? String ?: "",
                subtotal = (data["subtotal"] as? Number)?.toDouble() ?: 0.0,
                tax = (data["tax"] as? Number)?.toDouble() ?: 0.0,
                shippingFee = (data["shippingFee"] as? Number)?.toDouble() ?: 0.0,
                discountAmount = (data["discountAmount"] as? Number)?.toDouble() ?: 0.0,
                totalAmount = (data["totalAmount"] as? Number)?.toDouble() ?: 0.0,
                status = data["status"] as? String ?: "Order Placed",
                createdAt = (data["createdAt"] as? Number)?.toLong() ?: System.currentTimeMillis(),
                items = itemsList
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun updateFirestoreOrderStatus(orderCode: String, newStatus: String) {
        try {
            val firestore = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            firestore.collection("orders")
                .document(orderCode)
                .update("status", newStatus)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun deleteOrder(orderId: Long) {
        dao.deleteOrder(orderId)
    }

    suspend fun sendChatMessage(userMessage: String, isUser: Boolean = true) {
        val sender = if (isUser) "user" else "store"
        dao.insertChatMessage(ChatMessageEntity(sender = sender, message = userMessage))
    }

    suspend fun sendChatMessageWithAi(
        userMessage: String,
        inventory: List<ProductEntity>,
        history: List<ChatMessageEntity>
    ) {
        dao.insertChatMessage(ChatMessageEntity(sender = "user", message = userMessage))

        val aiReply = GeminiAssistantService.generateAssistantResponse(
            userPrompt = userMessage,
            inventory = inventory,
            chatHistory = history
        )

        dao.insertChatMessage(ChatMessageEntity(sender = "store", message = aiReply))
    }

}
