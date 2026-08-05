package com.example.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.Product
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class ProductUiState {
    object Loading : ProductUiState()
    data class Success(val products: List<Product>) : ProductUiState()
    data class Error(val message: String) : ProductUiState()
}

class ProductViewModel : ViewModel() {

    private val firestore: FirebaseFirestore? by lazy {
        try {
            FirebaseFirestore.getInstance()
        } catch (e: Throwable) {
            Log.e("ProductViewModel", "FirebaseFirestore is not initialized: ${e.message}", e)
            null
        }
    }

    private val _productsState = MutableStateFlow<ProductUiState>(ProductUiState.Loading)
    val productsState: StateFlow<ProductUiState> = _productsState.asStateFlow()

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    init {
        fetchProducts()
    }

    fun fetchProducts() {
        _productsState.value = ProductUiState.Loading
        val db = firestore
        if (db == null) {
            _productsState.value = ProductUiState.Error("FirebaseApp / Firestore ยังไม่ได้ตั้งค่าระบบ")
            return
        }
        try {
            db.collection("products")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e("ProductViewModel", "Error fetching products from Firestore", error)
                        _productsState.value = ProductUiState.Error(error.localizedMessage ?: "Failed to load products")
                        return@addSnapshotListener
                    }

                    if (snapshot != null) {
                        val productList = snapshot.documents.mapNotNull { doc ->
                            doc.toObject(Product::class.java)?.copy(id = doc.id)
                        }
                        _products.value = productList
                        _productsState.value = ProductUiState.Success(productList)
                    }
                }
        } catch (e: Exception) {
            Log.e("ProductViewModel", "Exception initializing Firestore snapshot listener", e)
            _productsState.value = ProductUiState.Error(e.localizedMessage ?: "An error occurred")
        }
    }

    fun addProduct(product: Product, onResult: (Boolean) -> Unit = {}) {
        val db = firestore
        if (db == null) {
            onResult(false)
            return
        }
        val productMap = hashMapOf(
            "name" to product.name,
            "price" to product.price,
            "description" to product.description,
            "imageUrl" to product.imageUrl
        )
        db.collection("products")
            .add(productMap)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun updateProduct(product: Product, onResult: (Boolean) -> Unit = {}) {
        if (product.id.isBlank()) {
            onResult(false)
            return
        }
        val db = firestore
        if (db == null) {
            onResult(false)
            return
        }
        val productMap = hashMapOf<String, Any>(
            "name" to product.name,
            "price" to product.price,
            "description" to product.description,
            "imageUrl" to product.imageUrl
        )
        db.collection("products")
            .document(product.id)
            .update(productMap)
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }

    fun deleteProduct(productId: String, onResult: (Boolean) -> Unit = {}) {
        if (productId.isBlank()) {
            onResult(false)
            return
        }
        val db = firestore
        if (db == null) {
            onResult(false)
            return
        }
        db.collection("products")
            .document(productId)
            .delete()
            .addOnSuccessListener { onResult(true) }
            .addOnFailureListener { onResult(false) }
    }
}
