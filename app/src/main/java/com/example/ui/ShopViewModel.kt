package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.Campaign
import com.example.data.CampaignLogic
import com.example.data.CartItemWithProduct
import com.example.data.ChatMessageEntity
import com.example.data.OrderEntity
import com.example.data.ProductEntity
import com.example.data.ShopDatabase
import com.example.data.ShopRepository
import com.example.notifications.OrderNotifier
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class ShopViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: ShopRepository

    init {
        val dao = ShopDatabase.getDatabase(application).shopDao()
        repository = ShopRepository(dao)

        // Keep the local (Room-backed) storefront in sync with the shared
        // Firestore `products` catalog that the web admin manages, so products
        // uploaded/edited on the website appear in the app automatically.
        viewModelScope.launch {
            repository.getFirestoreProductsFlow().collect { products ->
                repository.syncProductsToRoom(products)
            }
        }
    }

    // Filter states
    private val _selectedCategory = MutableStateFlow("ทั้งหมด")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    fun selectCategory(category: String) {
        _selectedCategory.value = category
    }

    // User Profile state
    private val _userName = MutableStateFlow("John Doe")
    val userName: StateFlow<String> = _userName.asStateFlow()

    private val _userEmail = MutableStateFlow("xlx3805@gmail.com")
    val userEmail: StateFlow<String> = _userEmail.asStateFlow()

    private val _userPhone = MutableStateFlow("081-234-5678")
    val userPhone: StateFlow<String> = _userPhone.asStateFlow()

    fun updateUserProfile(name: String, email: String, phone: String) {
        if (name.isNotBlank()) _userName.value = name
        if (email.isNotBlank()) _userEmail.value = email
        if (phone.isNotBlank()) _userPhone.value = phone
    }

    // Delivery Addresses state
    private val _deliveryAddresses = MutableStateFlow(
        listOf(
            com.example.data.DeliveryAddress(
                id = "1",
                label = "Home",
                receiverName = "John Doe",
                phone = "081-234-5678",
                fullAddress = "123 Sukhumvit Road, Khlong Toei, Bangkok 10110",
                isDefault = true
            ),
            com.example.data.DeliveryAddress(
                id = "2",
                label = "Office",
                receiverName = "John Doe",
                phone = "081-234-5678",
                fullAddress = "456 Sathorn Tower, 18th Floor, Bang Rak, Bangkok 10500",
                isDefault = false
            )
        )
    )
    val deliveryAddresses: StateFlow<List<com.example.data.DeliveryAddress>> = _deliveryAddresses.asStateFlow()

    fun addDeliveryAddress(label: String, receiver: String, phone: String, address: String, setAsDefault: Boolean) {
        val newAddr = com.example.data.DeliveryAddress(
            label = label.ifBlank { "Address" },
            receiverName = receiver.ifBlank { _userName.value },
            phone = phone.ifBlank { _userPhone.value },
            fullAddress = address,
            isDefault = setAsDefault || _deliveryAddresses.value.isEmpty()
        )
        val updated = if (newAddr.isDefault) {
            _deliveryAddresses.value.map { it.copy(isDefault = false) } + newAddr
        } else {
            _deliveryAddresses.value + newAddr
        }
        _deliveryAddresses.value = updated
    }

    fun updateDeliveryAddress(updatedAddr: com.example.data.DeliveryAddress) {
        val list = _deliveryAddresses.value.map {
            if (it.id == updatedAddr.id) updatedAddr
            else if (updatedAddr.isDefault) it.copy(isDefault = false)
            else it
        }
        _deliveryAddresses.value = list
    }

    fun deleteDeliveryAddress(id: String) {
        val list = _deliveryAddresses.value.filter { it.id != id }
        _deliveryAddresses.value = list
    }

    fun setDefaultDeliveryAddress(id: String) {
        _deliveryAddresses.value = _deliveryAddresses.value.map {
            it.copy(isDefault = (it.id == id))
        }
    }

    // Product Reviews state
    private val _productReviews = MutableStateFlow<Map<Long, List<com.example.data.ProductReview>>>(
        mapOf(
            1L to listOf(
                com.example.data.ProductReview(
                    productId = 1L,
                    authorName = "Sarah K.",
                    rating = 5,
                    comment = "Excellent quality product! Fast delivery and sturdy packaging. Highly recommend!",
                    timestamp = "2026-07-28"
                ),
                com.example.data.ProductReview(
                    productId = 1L,
                    authorName = "Michael B.",
                    rating = 4,
                    comment = "Great value for money. Fits description perfectly.",
                    timestamp = "2026-07-25"
                )
            )
        )
    )
    val productReviews: StateFlow<Map<Long, List<com.example.data.ProductReview>>> = _productReviews.asStateFlow()

    fun addProductReview(productId: Long, rating: Int, comment: String) {
        val newReview = com.example.data.ProductReview(
            productId = productId,
            authorName = _userName.value,
            rating = rating,
            comment = comment,
            timestamp = "Today"
        )
        val currentList = _productReviews.value[productId] ?: emptyList()
        val updatedMap = _productReviews.value.toMutableMap()
        updatedMap[productId] = listOf(newReview) + currentList
        _productReviews.value = updatedMap
    }


    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    // Filtered Products
    val products: StateFlow<List<ProductEntity>> = combine(
        repository.allProducts,
        _selectedCategory,
        _searchQuery
    ) { all, category, query ->
        all.filter { product ->
            val matchCategory = category == "ทั้งหมด" || product.category == category
            val matchQuery = query.isBlank() ||
                    product.title.contains(query, ignoreCase = true) ||
                    product.description.contains(query, ignoreCase = true)
            matchCategory && matchQuery
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val allRawProducts: StateFlow<List<ProductEntity>> = repository.allProducts.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Cart items with product details
    val cartWithProducts: StateFlow<List<CartItemWithProduct>> = repository.cartWithProducts.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Local Room Orders
    val orders: StateFlow<List<OrderEntity>> = repository.allOrders.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Firestore Live Orders
    val firestoreOrders: StateFlow<List<com.example.data.FirestoreOrder>> = repository.getFirestoreOrdersFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Live discount campaign / flash sale (shared with website via Firestore config/campaign)
    val campaign: StateFlow<Campaign> = repository.getCampaignFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = Campaign.DEFAULT
    )

    // Live PromptPay payment config (shared with website via Firestore config/payment)
    val payment: StateFlow<com.example.data.PaymentConfig> = repository.getPaymentFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = com.example.data.PaymentConfig.DEFAULT
    )

    // Live store theme / branding (shared with website via Firestore config/theme)
    val theme: StateFlow<com.example.data.ThemeConfig> = repository.getThemeFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = com.example.data.ThemeConfig.DEFAULT
    )

    // Live hero-banner slides (shared with website via Firestore config/hero)
    val hero: StateFlow<com.example.data.HeroConfig> = repository.getHeroFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = com.example.data.HeroConfig.DEFAULT
    )

    // Live ศูนย์ข่าวสาร / แจ้งเตือน (shared with website via Firestore collection `news`)
    val news: StateFlow<List<com.example.data.News>> = repository.getNewsFlow().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Day/night: null = follow the admin default from config/theme; true/false = user override.
    private val _darkOverride = MutableStateFlow<Boolean?>(null)
    val darkOverride: StateFlow<Boolean?> = _darkOverride.asStateFlow()

    /** Effective dark mode: user override if set, else the admin's config/theme default. */
    val isDark: StateFlow<Boolean> = combine(theme, _darkOverride) { t, override ->
        override ?: t.darkModeDefault
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = false
    )

    fun toggleDarkMode() {
        _darkOverride.value = !(isDark.value)
    }

    /** Uploads a payment slip (base64) to the given order for admin review. */
    fun attachSlip(orderCode: String, slipDataUrl: String) {
        viewModelScope.launch {
            repository.attachOrderSlip(orderCode, slipDataUrl)
        }
    }

    fun updateFirestoreOrderStatus(orderCode: String, newStatus: String) {
        viewModelScope.launch {
            val oldStatus = firestoreOrders.value
                .firstOrNull { it.orderCode == orderCode }?.status
            repository.updateFirestoreOrderStatus(orderCode, newStatus)
            if (oldStatus == null || oldStatus != newStatus) {
                OrderNotifier.notifyStatusChange(getApplication(), orderCode, newStatus)
            }
        }
    }

    // Chat
    val chatMessages: StateFlow<List<ChatMessageEntity>> = repository.chatMessages.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Product Detail modal state
    private val _selectedProduct = MutableStateFlow<ProductEntity?>(null)
    val selectedProduct: StateFlow<ProductEntity?> = _selectedProduct.asStateFlow()

    // Add/Edit Product dialog state (for Backend Admin)
    private val _productBeingEdited = MutableStateFlow<ProductEntity?>(null)
    val productBeingEdited: StateFlow<ProductEntity?> = _productBeingEdited.asStateFlow()

    private val _showAddEditDialog = MutableStateFlow(false)
    val showAddEditDialog: StateFlow<Boolean> = _showAddEditDialog.asStateFlow()

    // Checkout dialog state
    private val _showCheckoutDialog = MutableStateFlow(false)
    val showCheckoutDialog: StateFlow<Boolean> = _showCheckoutDialog.asStateFlow()

    // Coupon discount — validated against the live campaign (percent, per-item, or clearance)
    private val _discountCode = MutableStateFlow("")
    val discountCode: StateFlow<String> = _discountCode.asStateFlow()

    /** Recomputed live from (code, campaign, cart) so product-scope discounts stay correct. */
    val promoResult: StateFlow<com.example.data.PromoResult> = combine(
        _discountCode, campaign, cartWithProducts
    ) { code, camp, items ->
        CampaignLogic.applyPromo(code, camp, items)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = com.example.data.PromoResult()
    )

    val discountAmount: StateFlow<Double> = promoResult.map { it.amount }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 0.0
    )

    val discountMessage: StateFlow<String> = promoResult.map { it.message }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = ""
    )

    val discountLabel: StateFlow<String> = promoResult.map {
        if (it.ok) it.label else "ส่วนลด"
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = "ส่วนลด"
    )

    // Snackbar event stream
    private val _snackbarEvent = MutableSharedFlow<String>()
    val snackbarEvent: SharedFlow<String> = _snackbarEvent.asSharedFlow()

    // Navigation and Admin Mode toggle
    private val _isAdminMode = MutableStateFlow(false)
    val isAdminMode: StateFlow<Boolean> = _isAdminMode.asStateFlow()

    private val _adminTab = MutableStateFlow(0) // 0: Inventory, 1: Orders, 2: Analytics
    val adminTab: StateFlow<Int> = _adminTab.asStateFlow()

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun openProductDetail(product: ProductEntity) {
        _selectedProduct.value = product
    }

    fun closeProductDetail() {
        _selectedProduct.value = null
    }

    fun toggleAdminMode() {
        _isAdminMode.value = !_isAdminMode.value
    }

    fun setAdminTab(tab: Int) {
        _adminTab.value = tab
    }

    // Cart actions
    fun addToCart(product: ProductEntity, qty: Int = 1) {
        viewModelScope.launch {
            val currentCart = cartWithProducts.value
            val existing = currentCart.find { it.productId == product.id }
            val currentQty = existing?.quantity ?: 0
            repository.updateCartQuantity(product.id, currentQty + qty)
            _snackbarEvent.emit("เพิ่ม \"${product.title}\" ลงในตะกร้าเรียบร้อยแล้ว")
        }
    }

    fun updateCartQuantity(productId: Long, quantity: Int) {
        viewModelScope.launch {
            repository.updateCartQuantity(productId, quantity)
        }
    }

    fun removeFromCart(productId: Long) {
        viewModelScope.launch {
            repository.removeFromCart(productId)
        }
    }

    /** Updates the entered promo code; validation/discount is derived reactively in [promoResult]. */
    fun applyDiscountCode(code: String) {
        _discountCode.value = code
    }

    private val _isPlacingOrder = MutableStateFlow(false)
    val isPlacingOrder: StateFlow<Boolean> = _isPlacingOrder.asStateFlow()

    private val _placedOrderCode = MutableStateFlow<String?>(null)
    val placedOrderCode: StateFlow<String?> = _placedOrderCode.asStateFlow()

    // Total + payment method of the just-placed order, used to render the
    // PromptPay QR (with amount) on the success screen.
    private val _placedOrderTotal = MutableStateFlow(0.0)
    val placedOrderTotal: StateFlow<Double> = _placedOrderTotal.asStateFlow()

    private val _placedOrderPayment = MutableStateFlow("")
    val placedOrderPayment: StateFlow<String> = _placedOrderPayment.asStateFlow()

    fun resetPlacedOrderState() {
        _placedOrderCode.value = null
        _isPlacingOrder.value = false
    }

    fun openCheckout() {
        _showCheckoutDialog.value = true
    }

    fun closeCheckout() {
        _showCheckoutDialog.value = false
    }

    fun placeOrderToFirestore(
        customerName: String,
        customerPhone: String,
        shippingAddress: String,
        paymentMethod: String,
        onSuccess: (orderCode: String) -> Unit = {}
    ) {
        viewModelScope.launch {
            _isPlacingOrder.value = true
            val cartList = cartWithProducts.value
            if (cartList.isEmpty()) {
                _isPlacingOrder.value = false
                return@launch
            }

            val subtotal = cartList.sumOf { (it.product?.price ?: 0.0) * it.quantity }
            val promo = promoResult.value
            val discountVal = if (promo.ok) promo.amount else 0.0
            val appliedCode = if (promo.ok) _discountCode.value.trim().uppercase() else ""
            val tax = subtotal * 0.07
            val shipping = if (subtotal > 500) 0.0 else 30.0
            val grandTotal = subtotal + tax + shipping - discountVal

            val code = repository.placeOrderWithFirestore(
                customerName = customerName,
                customerPhone = customerPhone,
                shippingAddress = shippingAddress,
                paymentMethod = paymentMethod,
                items = cartList,
                subtotal = subtotal,
                tax = tax,
                shippingFee = shipping,
                discountAmount = discountVal,
                totalAmount = grandTotal,
                promoCode = appliedCode
            )

            _isPlacingOrder.value = false
            _placedOrderCode.value = code
            _placedOrderTotal.value = grandTotal
            _placedOrderPayment.value = paymentMethod
            _showCheckoutDialog.value = false
            _discountCode.value = ""

            onSuccess(code)
        }
    }

    fun confirmOrder(
        name: String,
        phone: String,
        address: String,
        paymentMethod: String
    ) {
        placeOrderToFirestore(name, phone, address, paymentMethod)
    }

    // Admin / Backend Actions
    fun openAddProductDialog() {
        _productBeingEdited.value = ProductEntity(
            title = "",
            price = 0.0,
            originalPrice = 0.0,
            category = "แฟชั่น",
            description = "",
            imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
            stock = 10,
            rating = 5.0f,
            isFeatured = false
        )
        _showAddEditDialog.value = true
    }

    fun openEditProductDialog(product: ProductEntity) {
        _productBeingEdited.value = product
        _showAddEditDialog.value = true
    }

    fun closeAddEditDialog() {
        _showAddEditDialog.value = false
        _productBeingEdited.value = null
    }

    fun saveProduct(product: ProductEntity) {
        viewModelScope.launch {
            repository.insertOrUpdateProduct(product)
            closeAddEditDialog()
        }
    }

    fun deleteProduct(productId: Long) {
        viewModelScope.launch {
            repository.deleteProduct(productId)
        }
    }

    fun updateOrderStatus(orderId: Long, newStatus: String) {
        viewModelScope.launch {
            val existing = repository.getOrderById(orderId)
            repository.updateOrderStatus(orderId, newStatus)
            if (existing != null && existing.status != newStatus) {
                OrderNotifier.notifyStatusChange(getApplication(), existing.orderCode, newStatus)
            }
        }
    }

    fun deleteOrder(orderId: Long) {
        viewModelScope.launch {
            repository.deleteOrder(orderId)
        }
    }

    // Chat & AI Support
    private val _isAiThinking = MutableStateFlow(false)
    val isAiThinking: StateFlow<Boolean> = _isAiThinking.asStateFlow()

    fun sendAiChatMessage(msg: String) {
        if (msg.isBlank()) return
        viewModelScope.launch {
            _isAiThinking.value = true
            try {
                val inventory = allRawProducts.value
                val history = chatMessages.value
                repository.sendChatMessageWithAi(
                    userMessage = msg,
                    inventory = inventory,
                    history = history
                )
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isAiThinking.value = false
            }
        }
    }

    fun sendMessage(msg: String) {
        sendAiChatMessage(msg)
    }

}
