package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.Product
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

/**
 * Cart item containing a [Product] and its selected quantity.
 */
data class CartItem(
    val product: Product,
    val quantity: Int = 1
) {
    val totalPrice: Double
        get() = product.price * quantity
}

/**
 * ViewModel to manage shopping cart state, calculate total price,
 * and handle item quantity adjustments.
 */
class ShoppingCartViewModel : ViewModel() {

    private val _cartItems = MutableStateFlow<List<CartItem>>(emptyList())
    val cartItems: StateFlow<List<CartItem>> = _cartItems.asStateFlow()

    /**
     * Total price calculated dynamically from current cart items.
     */
    val totalPrice: StateFlow<Double> = _cartItems
        .map { items -> items.sumOf { it.totalPrice } }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0.0
        )

    /**
     * Total count of all items (sum of quantities) in the cart.
     */
    val totalItemCount: StateFlow<Int> = _cartItems
        .map { items -> items.sumOf { it.quantity } }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )

    /**
     * Add a product to the cart or increase its quantity if already present.
     */
    fun addItem(product: Product, quantity: Int = 1) {
        if (quantity <= 0) return
        val currentList = _cartItems.value.toMutableList()
        val index = currentList.indexOfFirst { it.product.id == product.id }

        if (index != -1) {
            val existing = currentList[index]
            currentList[index] = existing.copy(quantity = existing.quantity + quantity)
        } else {
            currentList.add(CartItem(product = product, quantity = quantity))
        }
        _cartItems.value = currentList
    }

    /**
     * Update the quantity of a specific item in the cart.
     * If quantity is <= 0, the item is removed.
     */
    fun updateQuantity(productId: String, newQuantity: Int) {
        if (newQuantity <= 0) {
            removeItem(productId)
            return
        }

        val currentList = _cartItems.value.toMutableList()
        val index = currentList.indexOfFirst { it.product.id == productId }

        if (index != -1) {
            currentList[index] = currentList[index].copy(quantity = newQuantity)
            _cartItems.value = currentList
        }
    }

    /**
     * Remove an item from the cart by its product ID.
     */
    fun removeItem(productId: String) {
        _cartItems.value = _cartItems.value.filter { it.product.id != productId }
    }

    /**
     * Clear all items from the cart.
     */
    fun clearCart() {
        _cartItems.value = emptyList()
    }
}
