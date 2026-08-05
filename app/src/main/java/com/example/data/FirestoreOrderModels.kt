package com.example.data

data class FirestoreOrderItem(
    val productId: Long = 0L,
    val title: String = "",
    val price: Double = 0.0,
    val quantity: Int = 0,
    val imageUrl: String = ""
)

data class FirestoreOrder(
    val orderCode: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val shippingAddress: String = "",
    val paymentMethod: String = "",
    val subtotal: Double = 0.0,
    val tax: Double = 0.0,
    val shippingFee: Double = 0.0,
    val discountAmount: Double = 0.0,
    val totalAmount: Double = 0.0,
    val status: String = "Order Placed",
    val createdAt: Long = System.currentTimeMillis(),
    val items: List<FirestoreOrderItem> = emptyList()
)
