package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.CartItemWithProduct
import com.example.data.PaymentConfig
import com.example.data.PromptPay
import com.example.ui.ShopViewModel
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.graphics.asImageBitmap
import java.io.ByteArrayOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderSummaryScreen(
    viewModel: ShopViewModel,
    onBack: () -> Unit,
    onOrderPlacedSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val cartItems by viewModel.cartWithProducts.collectAsStateWithLifecycle()
    val discountAmount by viewModel.discountAmount.collectAsStateWithLifecycle()
    val discountLabel by viewModel.discountLabel.collectAsStateWithLifecycle()
    val promoResult by viewModel.promoResult.collectAsStateWithLifecycle()
    val isPlacingOrder by viewModel.isPlacingOrder.collectAsStateWithLifecycle()
    val placedOrderCode by viewModel.placedOrderCode.collectAsStateWithLifecycle()
    val paymentConfig by viewModel.payment.collectAsStateWithLifecycle()
    val theme by viewModel.theme.collectAsStateWithLifecycle()
    val placedOrderTotal by viewModel.placedOrderTotal.collectAsStateWithLifecycle()
    val placedOrderPayment by viewModel.placedOrderPayment.collectAsStateWithLifecycle()

    var customerName by remember { mutableStateOf("Somchai Jaidee") }
    var customerPhone by remember { mutableStateOf("081-234-5678") }
    var shippingAddress by remember { mutableStateOf("99/1 Sukhumvit Road, Khlong Toei, Bangkok 10110") }
    var selectedPayment by remember { mutableStateOf("PromptPay QR") }

    // Calculated amounts
    val subtotal = cartItems.sumOf { (it.product?.price ?: 0.0) * it.quantity }
    val tax = subtotal * 0.07 // 7% VAT
    val discount = if (promoResult.ok) discountAmount else 0.0
    val shippingFee = if (subtotal > 500 || cartItems.isEmpty()) 0.0 else 30.0
    val grandTotal = subtotal + tax + shippingFee - discount

    // Success dialog when order placed to Firestore
    placedOrderCode?.let { code ->
        AlertDialog(
            onDismissRequest = {
                viewModel.resetPlacedOrderState()
                onOrderPlacedSuccess()
            },
            icon = {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Success",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(52.dp)
                )
            },
            title = {
                Text(
                    text = "Order Placed Successfully!",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Order Code: $code",
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    if (placedOrderPayment.contains("PromptPay")) {
                        PromptPaySlipSection(
                            payment = paymentConfig,
                            orderCode = code,
                            amount = placedOrderTotal,
                            onSubmitSlip = { dataUrl -> viewModel.attachSlip(code, dataUrl) }
                        )
                    } else {
                        Text(
                            text = "บันทึกคำสั่งซื้อเรียบร้อยแล้ว ทางร้านจะอัปเดตสถานะให้ทราบเป็นระยะ",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.resetPlacedOrderState()
                        onOrderPlacedSuccess()
                    },
                    shape = RoundedCornerShape(20.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Done", fontWeight = FontWeight.Bold)
                }
            },
            shape = RoundedCornerShape(24.dp),
            containerColor = MaterialTheme.colorScheme.surface
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Order Summary",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 12.dp,
                tonalElevation = 6.dp,
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Grand Total",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.outline
                        )
                        Text(
                            text = "฿${String.format("%,.0f", grandTotal)}",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    Button(
                        onClick = {
                            if (customerName.isNotBlank() && customerPhone.isNotBlank() && shippingAddress.isNotBlank()) {
                                viewModel.placeOrderToFirestore(
                                    customerName = customerName,
                                    customerPhone = customerPhone,
                                    shippingAddress = shippingAddress,
                                    paymentMethod = selectedPayment
                                )
                            }
                        },
                        enabled = cartItems.isNotEmpty() && !isPlacingOrder,
                        shape = RoundedCornerShape(26.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier
                            .height(52.dp)
                            .testTag("place_order_btn")
                    ) {
                        if (isPlacingOrder) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Saving...", fontWeight = FontWeight.Bold)
                        } else {
                            Text("Place Order", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                }
            }
        },
        modifier = modifier.fillMaxSize()
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. Delivery Details Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Shipping & Contact Details",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = customerName,
                            onValueChange = { customerName = it },
                            label = { Text("Full Name") },
                            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("order_summary_name_input"),
                            shape = RoundedCornerShape(14.dp)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = customerPhone,
                            onValueChange = { customerPhone = it },
                            label = { Text("Phone Number") },
                            leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("order_summary_phone_input"),
                            shape = RoundedCornerShape(14.dp)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = shippingAddress,
                            onValueChange = { shippingAddress = it },
                            label = { Text("Shipping Address") },
                            leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                            maxLines = 3,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("order_summary_address_input"),
                            shape = RoundedCornerShape(14.dp)
                        )
                    }
                }
            }

            // 2. Final Ordered Items Section
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Order Items (${cartItems.sumOf { it.quantity }})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        if (cartItems.isEmpty()) {
                            Text(
                                text = "No items in cart",
                                color = MaterialTheme.colorScheme.outline,
                                fontSize = 13.sp
                            )
                        } else {
                            cartItems.forEachIndexed { index, cartItem ->
                                val product = cartItem.product
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 6.dp)
                                ) {
                                    AsyncImage(
                                        model = ImageRequest.Builder(context)
                                            .data(product?.imageUrl)
                                            .crossfade(true)
                                            .build(),
                                        contentDescription = product?.title,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color(0xFFF6F6F8))
                                    )

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = product?.title ?: "Product Item",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            maxLines = 1
                                        )
                                        Text(
                                            text = "Qty: ${cartItem.quantity}  ×  ฿${String.format("%,.0f", product?.price ?: 0.0)}",
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.outline
                                        )
                                    }

                                    Text(
                                        text = "฿${String.format("%,.0f", (product?.price ?: 0.0) * cartItem.quantity)}",
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 14.sp
                                    )
                                }

                                if (index < cartItems.size - 1) {
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 6.dp))
                                }
                            }
                        }
                    }
                }
            }

            // 3. Payment Method Selection Section
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Payment Method",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Option 1: PromptPay
                        PaymentOptionRow(
                            title = "PromptPay QR Code",
                            subtitle = "Instant scan & pay with zero fees",
                            icon = Icons.Default.QrCode2,
                            isSelected = selectedPayment == "PromptPay QR",
                            onClick = { selectedPayment = "PromptPay QR" }
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Option 2: Credit/Debit Card
                        PaymentOptionRow(
                            title = "Credit / Debit Card",
                            subtitle = "Visa, Mastercard, JCB",
                            icon = Icons.Default.CreditCard,
                            isSelected = selectedPayment == "Credit/Debit Card",
                            onClick = { selectedPayment = "Credit/Debit Card" }
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Option 3: Bank Transfer
                        PaymentOptionRow(
                            title = "Bank Transfer",
                            subtitle = "KBank, SCB, Bangkok Bank",
                            icon = Icons.Default.AccountBalance,
                            isSelected = selectedPayment == "Bank Transfer",
                            onClick = { selectedPayment = "Bank Transfer" }
                        )

                        // Option 4: COD (แสดงเมื่อแอดมินเปิดใช้ที่หลังบ้าน)
                        if (theme.codEnabled) {
                            Spacer(modifier = Modifier.height(8.dp))
                            PaymentOptionRow(
                                title = "Cash on Delivery (COD)",
                                subtitle = "Pay upon delivery receipt",
                                icon = Icons.Default.LocalShipping,
                                isSelected = selectedPayment == "Cash on Delivery (COD)",
                                onClick = { selectedPayment = "Cash on Delivery (COD)" }
                            )
                        }
                    }
                }
            }

            // 4. Financial Breakdown Card (Subtotal, Tax, Shipping, Discount, Total)
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Payment Summary",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Subtotal
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Subtotal", fontSize = 14.sp, color = MaterialTheme.colorScheme.outline)
                            Text("฿${String.format("%,.2f", subtotal)}", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Tax (7% VAT)
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Estimated Tax (7% VAT)", fontSize = 14.sp, color = MaterialTheme.colorScheme.outline)
                            Text("฿${String.format("%,.2f", tax)}", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Shipping Fee
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Shipping Fee", fontSize = 14.sp, color = MaterialTheme.colorScheme.outline)
                            Text(
                                text = if (shippingFee == 0.0) "FREE" else "฿${String.format("%,.0f", shippingFee)}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (shippingFee == 0.0) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurface
                            )
                        }

                        if (discount > 0) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(discountLabel, fontSize = 14.sp, color = MaterialTheme.colorScheme.tertiary)
                                Text("-฿${String.format("%,.2f", discount)}", fontSize = 14.sp, color = MaterialTheme.colorScheme.tertiary, fontWeight = FontWeight.Bold)
                            }
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                        // Total Price
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Final Total Amount", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text(
                                text = "฿${String.format("%,.2f", grandTotal)}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun PaymentOptionRow(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f) else Color(0xFFF9FAFB),
        border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(12.dp)
        ) {
            RadioButton(
                selected = isSelected,
                onClick = onClick
            )

            Spacer(modifier = Modifier.width(4.dp))

            Surface(
                shape = CircleShape,
                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.LightGray.copy(alpha = 0.3f),
                modifier = Modifier.size(36.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = if (isSelected) Color.White else Color.DarkGray,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.outline
                )
            }
        }
    }
}

/** Compresses a picked image into a small JPEG base64 data URL for Firestore. */
private fun compressToDataUrl(bitmap: Bitmap, maxSize: Int = 900, quality: Int = 60): String {
    val w = bitmap.width
    val h = bitmap.height
    val scaled = if (w > maxSize || h > maxSize) {
        val ratio = minOf(maxSize.toFloat() / w, maxSize.toFloat() / h)
        Bitmap.createScaledBitmap(bitmap, (w * ratio).toInt(), (h * ratio).toInt(), true)
    } else bitmap
    val stream = ByteArrayOutputStream()
    scaled.compress(Bitmap.CompressFormat.JPEG, quality, stream)
    val b64 = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    return "data:image/jpeg;base64,$b64"
}

/**
 * PromptPay QR + slip-attach block shown on the order-success dialog. Generates
 * a real EMVCo QR (with amount) client-side and lets the customer upload a
 * payment slip that is stored inline in Firestore (฿0, no Storage needed).
 */
@Composable
private fun PromptPaySlipSection(
    payment: PaymentConfig,
    orderCode: String,
    amount: Double,
    onSubmitSlip: (String) -> Unit
) {
    val context = LocalContext.current
    val qrBitmap = remember(payment.promptPayId, amount) {
        runCatching { PromptPay.qrBitmap(PromptPay.payload(payment.promptPayId, amount)) }.getOrNull()
    }
    var slipDataUrl by remember { mutableStateOf<String?>(null) }
    var slipPreview by remember { mutableStateOf<Bitmap?>(null) }
    var submitted by remember { mutableStateOf(false) }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            runCatching {
                context.contentResolver.openInputStream(uri)?.use { input ->
                    val bmp = BitmapFactory.decodeStream(input)
                    slipPreview = bmp
                    slipDataUrl = compressToDataUrl(bmp)
                }
            }
        }
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "ชำระด้วย PromptPay",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(Modifier.height(8.dp))
        qrBitmap?.let {
            Image(
                bitmap = it.asImageBitmap(),
                contentDescription = "PromptPay QR",
                modifier = Modifier.size(200.dp)
            )
        }
        Text(
            text = "฿${String.format("%,.2f", amount)}",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 20.sp,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = "พร้อมเพย์: ${payment.promptPayId}",
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.outline
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = payment.note,
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.outline
        )
        Spacer(Modifier.height(10.dp))

        if (submitted) {
            Text(
                text = "✓ ได้รับสลิปแล้ว รอทางร้านยืนยัน",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF16A34A)
            )
        } else {
            slipPreview?.let {
                Image(
                    bitmap = it.asImageBitmap(),
                    contentDescription = "สลิป",
                    modifier = Modifier
                        .height(120.dp)
                        .clip(RoundedCornerShape(12.dp))
                )
                Spacer(Modifier.height(8.dp))
            }
            OutlinedButton(
                onClick = { picker.launch("image/*") },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (slipDataUrl == null) "📎 แนบสลิปการโอนเงิน" else "เลือกรูปใหม่")
            }
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    slipDataUrl?.let {
                        onSubmitSlip(it)
                        submitted = true
                    }
                },
                enabled = slipDataUrl != null,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("submit_slip_btn")
            ) {
                Text("ยืนยันการชำระเงิน", fontWeight = FontWeight.Bold)
            }
        }
    }
}
