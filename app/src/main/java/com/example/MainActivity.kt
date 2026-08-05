package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import com.example.notifications.OrderNotifier
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonOutline
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.ShopViewModel
import com.example.ui.components.AddEditProductDialog
import com.example.ui.components.CheckoutDialog
import com.example.ui.components.FlashSaleHost
import com.example.ui.components.NewsCenterHost
import com.example.ui.components.ProductDetailSheet
import com.example.ui.screens.AdminScreen
import com.example.ui.screens.CartScreen
import com.example.ui.screens.ChatScreen
import com.example.ui.screens.ChatSupportScreen
import com.example.ui.screens.OrderHistoryScreen
import com.example.ui.screens.OrderSummaryScreen
import com.example.ui.screens.StorefrontScreen
import com.example.ui.screens.UserProfileScreen
import com.example.ui.theme.ShopHubTheme

class MainActivity : ComponentActivity() {

    private val viewModel: ShopViewModel by viewModels()

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* result ignored */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Set up local notifications for order status changes.
        OrderNotifier.createChannel(this)
        requestNotificationPermissionIfNeeded()

        setContent {
            val theme by viewModel.theme.collectAsStateWithLifecycle()
            val isDark by viewModel.isDark.collectAsStateWithLifecycle()
            ShopHubTheme(darkTheme = isDark, primaryColorHex = theme.primaryColor) {
                MainAppScreen(viewModel = viewModel)
            }
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(viewModel: ShopViewModel) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        viewModel.snackbarEvent.collect { message ->
            snackbarHostState.showSnackbar(
                message = message,
                withDismissAction = true
            )
        }
    }

    val isAdminMode by viewModel.isAdminMode.collectAsStateWithLifecycle()
    val cartList by viewModel.cartWithProducts.collectAsStateWithLifecycle()
    val totalCartCount = cartList.sumOf { it.quantity }

    val selectedProduct by viewModel.selectedProduct.collectAsStateWithLifecycle()
    val productReviews by viewModel.productReviews.collectAsStateWithLifecycle()
    val showCheckoutDialog by viewModel.showCheckoutDialog.collectAsStateWithLifecycle()
    val showAddEditDialog by viewModel.showAddEditDialog.collectAsStateWithLifecycle()
    val productToEdit by viewModel.productBeingEdited.collectAsStateWithLifecycle()
    val campaign by viewModel.campaign.collectAsStateWithLifecycle()
    val theme by viewModel.theme.collectAsStateWithLifecycle()
    val news by viewModel.news.collectAsStateWithLifecycle()
    val allProducts by viewModel.products.collectAsStateWithLifecycle()
    val isDark by viewModel.isDark.collectAsStateWithLifecycle()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            if (!showCheckoutDialog) {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 1.dp,
                shadowElevation = 0.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Left Grid/Menu Icon Button
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.background,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.GridView,
                                contentDescription = "Menu",
                                tint = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    // Title (brand name comes from the shared config/theme)
                    Text(
                        text = if (isAdminMode) "${theme.brandName} Admin" else theme.brandName,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    // Right Actions (Day/Night, Notification Bell & Admin Toggle)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Day / Night toggle (only when the admin allows customers to switch)
                        if (theme.allowUserToggle) {
                            IconButton(
                                onClick = { viewModel.toggleDarkMode() },
                                modifier = Modifier.testTag("dark_toggle_btn")
                            ) {
                                Icon(
                                    imageVector = if (isDark) Icons.Default.LightMode else Icons.Default.DarkMode,
                                    contentDescription = "สลับโหมดกลางวัน/กลางคืน",
                                    tint = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }

                        // Admin Toggle Button
                        IconButton(
                            onClick = { viewModel.toggleAdminMode() },
                            modifier = Modifier.testTag("admin_toggle_btn")
                        ) {
                            Icon(
                                imageVector = Icons.Default.AdminPanelSettings,
                                contentDescription = "Toggle Admin Mode",
                                tint = if (isAdminMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                            )
                        }

                        // Notification Bell
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.background,
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.NotificationsNone,
                                    contentDescription = "Notifications",
                                    tint = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }
            }
        },
        bottomBar = {
            if (!isAdminMode && !showCheckoutDialog) {
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    tonalElevation = 8.dp,
                    shadowElevation = 12.dp,
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(vertical = 8.dp, horizontal = 16.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // 0: Storefront (Home)
                        IconButton(
                            onClick = { selectedTab = 0 },
                            modifier = Modifier.testTag("nav_tab_storefront")
                        ) {
                            if (selectedTab == 0) {
                                Surface(
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(44.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.Home,
                                            contentDescription = "Home",
                                            tint = Color.White,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Home,
                                    contentDescription = "Home",
                                    tint = MaterialTheme.colorScheme.outline,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }

                        // 3: Orders History Icon
                        IconButton(
                            onClick = { selectedTab = 3 },
                            modifier = Modifier.testTag("nav_tab_orders")
                        ) {
                            if (selectedTab == 3) {
                                Surface(
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(44.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.ReceiptLong,
                                            contentDescription = "Orders",
                                            tint = Color.White,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                            } else {
                                Icon(
                                    imageVector = Icons.Default.ReceiptLong,
                                    contentDescription = "Orders",
                                    tint = MaterialTheme.colorScheme.outline,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }

                        // 1: Cart Icon with Badge
                        IconButton(
                            onClick = { selectedTab = 1 },
                            modifier = Modifier.testTag("nav_tab_cart")
                        ) {
                            if (selectedTab == 1) {
                                Surface(
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(44.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        BadgedBox(
                                            badge = {
                                                if (totalCartCount > 0) {
                                                    Badge(containerColor = Color.White) {
                                                        Text("$totalCartCount", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                            }
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.ShoppingCart,
                                                contentDescription = "Cart",
                                                tint = Color.White,
                                                modifier = Modifier.size(22.dp)
                                            )
                                        }
                                    }
                                }
                            } else {
                                BadgedBox(
                                    badge = {
                                        if (totalCartCount > 0) {
                                            Badge(containerColor = MaterialTheme.colorScheme.primary) {
                                                Text("$totalCartCount", color = Color.White)
                                            }
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ShoppingCart,
                                        contentDescription = "Cart",
                                        tint = MaterialTheme.colorScheme.outline,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                        }

                        // 2: Chat
                        IconButton(
                            onClick = { selectedTab = 2 },
                            modifier = Modifier.testTag("nav_tab_chat")
                        ) {
                            if (selectedTab == 2) {
                                Surface(
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(44.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.Chat,
                                            contentDescription = "Chat",
                                            tint = Color.White,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Chat,
                                    contentDescription = "Chat",
                                    tint = MaterialTheme.colorScheme.outline,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }

                        // Profile Icon
                        IconButton(
                            onClick = { selectedTab = 4 },
                            modifier = Modifier.testTag("nav_tab_profile")
                        ) {
                            if (selectedTab == 4) {
                                Surface(
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(44.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = "Profile",
                                            tint = Color.White,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                            } else {
                                Icon(
                                    imageVector = Icons.Default.PersonOutline,
                                    contentDescription = "Profile",
                                    tint = MaterialTheme.colorScheme.outline,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                    }
                }
            }
        },
        modifier = Modifier.fillMaxSize()
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isAdminMode) {
                AdminScreen(viewModel = viewModel)
            } else {
                when (selectedTab) {
                    0 -> StorefrontScreen(
                        viewModel = viewModel,
                        onProductClick = { product -> viewModel.openProductDetail(product) }
                    )
                    1 -> CartScreen(
                        viewModel = viewModel,
                        onNavigateToStore = { selectedTab = 0 }
                    )
                    2 -> ChatSupportScreen(
                        viewModel = viewModel
                    )
                    3 -> OrderHistoryScreen(
                        viewModel = viewModel,
                        onBack = { selectedTab = 0 },
                        onNavigateToShop = { selectedTab = 0 }
                    )
                    4 -> UserProfileScreen(
                        viewModel = viewModel,
                        onNavigateToOrders = { selectedTab = 3 },
                        onNavigateToChat = { selectedTab = 2 },
                        onNavigateToStore = { selectedTab = 0 }
                    )
                }
            }
        }

        // Flash-sale popup (storefront only, once per campaign)
        if (!isAdminMode && !showCheckoutDialog && selectedTab == 0 && selectedProduct == null) {
            FlashSaleHost(campaign = campaign)
        }

        // ปุ่มไลน์ลอยขวามือ (ตั้งลิงก์ + เปิด/ปิดจากหลังบ้าน แชร์กับเว็บผ่าน config/theme)
        if (!isAdminMode && !showCheckoutDialog && theme.lineEnabled && theme.lineUrl.isNotBlank()) {
            FloatingLineButton(url = theme.lineUrl)
        }

        // ศูนย์ข่าวสาร / แจ้งเตือน ลอยขวามือ (แชร์ข่าวกับเว็บผ่าน Firestore `news`)
        if (!isAdminMode && !showCheckoutDialog && selectedProduct == null) {
            NewsCenterHost(
                news = news,
                theme = theme,
                onOpenProduct = { pid ->
                    allProducts.firstOrNull { it.id.toString() == pid }
                        ?.let { product ->
                            selectedTab = 0
                            viewModel.openProductDetail(product)
                        }
                }
            )
        }

        // Modals & Sheets
        selectedProduct?.let { product ->
            ProductDetailSheet(
                product = product,
                reviews = productReviews[product.id] ?: emptyList(),
                onSubmitReview = { rating, comment ->
                    viewModel.addProductReview(product.id, rating, comment)
                },
                onDismiss = { viewModel.closeProductDetail() },
                onAddToCart = { prod, qty -> viewModel.addToCart(prod, qty) }
            )
        }

        if (showCheckoutDialog) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                OrderSummaryScreen(
                    viewModel = viewModel,
                    onBack = { viewModel.closeCheckout() },
                    onOrderPlacedSuccess = {
                        viewModel.closeCheckout()
                        selectedTab = 3
                    }
                )
            }
        }

        if (showAddEditDialog) {
            AddEditProductDialog(
                productToEdit = productToEdit,
                onDismiss = { viewModel.closeAddEditDialog() },
                onSaveProduct = { product -> viewModel.saveProduct(product) }
            )
        }
    }
}

/** ปุ่มไลน์ลอยขวามือ — แตะแล้วเปิดลิงก์ไลน์ที่แอดมินตั้งไว้ */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FloatingLineButton(url: String) {
    val uriHandler = LocalUriHandler.current
    val lineGreen = Color(0xFF06C755)
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.CenterEnd
    ) {
        Surface(
            onClick = { runCatching { uriHandler.openUri(url) } },
            shape = RoundedCornerShape(28.dp),
            color = lineGreen,
            shadowElevation = 8.dp,
            modifier = Modifier
                .padding(end = 12.dp)
                .testTag("floating_line_button")
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Chat,
                    contentDescription = "แชทไลน์",
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
                Text(
                    text = "แชทไลน์",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}
