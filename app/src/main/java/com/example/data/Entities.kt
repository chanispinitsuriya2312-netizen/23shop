package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val price: Double,
    val originalPrice: Double = 0.0,
    val category: String,
    val description: String,
    val imageUrl: String,
    val mediaJson: String = "", // JSON array of {type,url,caption}; empty = fall back to imageUrl
    val stock: Int = 10,
    val rating: Float = 4.8f,
    val salesCount: Int = 0,
    val isFeatured: Boolean = false,
    // Highlight badge (mirrors web product.badge). type=none means no badge.
    val badgeType: String = "none",
    val badgeText: String = "",
    val badgeEndsAt: Long = 0L,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "cart_items")
data class CartItemEntity(
    @PrimaryKey val productId: Long,
    val quantity: Int
)

@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val orderCode: String,
    val customerName: String,
    val customerPhone: String,
    val shippingAddress: String,
    val paymentMethod: String,
    val totalAmount: Double,
    val status: String, // "กำลังเตรียมจัดส่ง", "อยู่ระหว่างจัดส่ง", "จัดส่งสำเร็จ", "ยกเลิก"
    val itemsSummary: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sender: String, // "user", "store"
    val message: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class CartItemWithProduct(
    val productId: Long,
    val quantity: Int,
    val product: ProductEntity?
)

data class ProductReview(
    val id: String = java.util.UUID.randomUUID().toString(),
    val productId: Long,
    val authorName: String,
    val rating: Int, // 1 to 5
    val comment: String,
    val timestamp: String
)

data class DeliveryAddress(
    val id: String = java.util.UUID.randomUUID().toString(),
    val label: String, // e.g. "Home", "Office", "Condo"
    val receiverName: String,
    val phone: String,
    val fullAddress: String,
    val isDefault: Boolean = false
)

