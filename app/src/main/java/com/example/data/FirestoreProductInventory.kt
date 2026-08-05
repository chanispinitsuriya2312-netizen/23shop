package com.example.data

import com.google.firebase.firestore.DocumentId

/**
 * Data model for storing product inventory in Google Cloud Firestore.
 * Provides default values for all properties to support automatic Firestore serialization/deserialization.
 */
data class FirestoreProductInventory(
    @DocumentId
    val id: String = "",
    val productId: Long = 0L,
    val title: String = "",
    val price: Double = 0.0,
    val originalPrice: Double = 0.0,
    val category: String = "",
    val description: String = "",
    val imageUrl: String = "",
    val media: List<Map<String, Any?>> = emptyList(),
    val stock: Int = 0,
    val rating: Float = 0.0f,
    val salesCount: Int = 0,
    val isFeatured: Boolean = false,
    val sku: String = "",
    val isAvailable: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    /**
     * Converts this Firestore product inventory model to a Room [ProductEntity].
     */
    fun toProductEntity(): ProductEntity {
        return ProductEntity(
            id = productId.takeIf { it != 0L } ?: (id.hashCode().toLong() and 0x7FFFFFFF),
            title = title,
            price = price,
            originalPrice = originalPrice,
            category = category,
            description = description,
            imageUrl = imageUrl,
            mediaJson = ProductMedia.jsonFromFirestore(media),
            stock = stock,
            rating = rating,
            salesCount = salesCount,
            isFeatured = isFeatured,
            createdAt = createdAt
        )
    }

    companion object {
        /**
         * Creates a [FirestoreProductInventory] instance from a Room [ProductEntity].
         */
        fun fromProductEntity(entity: ProductEntity, sku: String = ""): FirestoreProductInventory {
            return FirestoreProductInventory(
                id = entity.id.toString(),
                productId = entity.id,
                title = entity.title,
                price = entity.price,
                originalPrice = entity.originalPrice,
                category = entity.category,
                description = entity.description,
                imageUrl = entity.imageUrl,
                media = ProductMedia.parse(entity.mediaJson, entity.imageUrl).map {
                    mapOf("type" to it.type, "url" to it.url, "caption" to it.caption)
                },
                stock = entity.stock,
                rating = entity.rating,
                salesCount = entity.salesCount,
                isFeatured = entity.isFeatured,
                sku = sku.ifBlank { "SKU-${entity.id}" },
                isAvailable = entity.stock > 0,
                createdAt = entity.createdAt,
                updatedAt = System.currentTimeMillis()
            )
        }
    }
}
