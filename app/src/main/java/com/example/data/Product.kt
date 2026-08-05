package com.example.data

import com.google.firebase.firestore.DocumentId

/**
 * Data class representing a product for Firestore document mapping.
 * Includes default parameter values required for Firestore deserialization.
 */
data class Product(
    @DocumentId
    val id: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val description: String = "",
    val imageUrl: String = ""
)
