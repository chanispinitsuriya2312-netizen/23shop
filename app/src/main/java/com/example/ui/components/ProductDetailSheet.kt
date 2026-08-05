package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Share
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.ProductEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailSheet(
    product: ProductEntity,
    reviews: List<com.example.data.ProductReview> = emptyList(),
    onSubmitReview: ((rating: Int, comment: String) -> Unit)? = null,
    onDismiss: () -> Unit,
    onAddToCart: (ProductEntity, Int) -> Unit
) {

    val context = LocalContext.current
    var quantity by remember { mutableIntStateOf(1) }
    var selectedColorIndex by remember { mutableIntStateOf(0) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Description, 1: Specifications, 2: Reviews
    var isFavorite by remember { mutableStateOf(false) }

    // Media catalog (images + videos with captions); falls back to imageUrl.
    val mediaList = remember(product.mediaJson, product.imageUrl) {
        com.example.data.ProductMedia.parse(product.mediaJson, product.imageUrl)
    }
    var selectedMediaIndex by remember(product.id) { mutableIntStateOf(0) }
    val currentMedia = mediaList.getOrNull(selectedMediaIndex)
    fun displayImage(m: com.example.data.ProductMedia): String {
        if (!m.isVideo) return m.url
        val yt = m.youTubeId
        return if (yt != null) "https://img.youtube.com/vi/$yt/hqdefault.jpg" else product.imageUrl
    }

    val colorsList = listOf(
        Color(0xFF800020), // Maroon
        Color(0xFF1E1E24), // Dark
        Color(0xFF1D4ED8), // Blue
        Color(0xFF8B4513), // Brown
        Color(0xFFE5E7EB)  // Light Gray
    )

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
            ) {
                // Top Header Image Area with Top Bar Icons
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1.1f)
                        .background(Color(0xFFF6F6F8))
                ) {
                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(currentMedia?.let { displayImage(it) } ?: product.imageUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = currentMedia?.caption?.ifBlank { product.title } ?: product.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )

                    // Play overlay for video media — opens in external player / YouTube.
                    if (currentMedia?.isVideo == true) {
                        Surface(
                            onClick = {
                                runCatching {
                                    context.startActivity(
                                        android.content.Intent(
                                            android.content.Intent.ACTION_VIEW,
                                            android.net.Uri.parse(currentMedia.url)
                                        )
                                    )
                                }
                            },
                            shape = CircleShape,
                            color = Color(0xCC000000),
                            modifier = Modifier
                                .align(Alignment.Center)
                                .size(64.dp)
                                .testTag("product_video_play_btn")
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.PlayArrow,
                                    contentDescription = "เล่นวิดีโอ",
                                    tint = Color.White,
                                    modifier = Modifier.size(36.dp)
                                )
                            }
                        }
                    }

                    // Top Actions Overlay (Back/Close, Share, Wishlist Heart)
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Surface(
                            onClick = onDismiss,
                            shape = CircleShape,
                            color = Color.White,
                            shadowElevation = 2.dp,
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.Black)
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Surface(
                                shape = CircleShape,
                                color = Color.White,
                                shadowElevation = 2.dp,
                                modifier = Modifier.size(40.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Share, contentDescription = "Share", tint = Color.Black, modifier = Modifier.size(20.dp))
                                }
                            }

                            Surface(
                                onClick = { isFavorite = !isFavorite },
                                shape = CircleShape,
                                color = Color.White,
                                shadowElevation = 2.dp,
                                modifier = Modifier.size(40.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                        contentDescription = "Favorite",
                                        tint = if (isFavorite) MaterialTheme.colorScheme.primary else Color.Black,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Image Pagination Dots (dynamic to media count)
                    if (mediaList.size > 1) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 12.dp)
                        ) {
                            mediaList.forEachIndexed { i, _ ->
                                if (i == selectedMediaIndex) {
                                    Box(modifier = Modifier.size(width = 16.dp, height = 6.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
                                } else {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color.LightGray))
                                }
                            }
                        }
                    }
                }

                // Thumbnail strip (click to switch media)
                if (mediaList.size > 1) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        mediaList.forEachIndexed { i, m ->
                            Box(
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFFF1F1F4))
                                    .border(
                                        width = if (i == selectedMediaIndex) 2.dp else 1.dp,
                                        color = if (i == selectedMediaIndex) MaterialTheme.colorScheme.primary else Color(0xFFE2E2E8),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable { selectedMediaIndex = i }
                            ) {
                                AsyncImage(
                                    model = ImageRequest.Builder(context).data(displayImage(m)).crossfade(true).build(),
                                    contentDescription = m.caption.ifBlank { "media ${i + 1}" },
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                if (m.isVideo) {
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier.fillMaxSize().background(Color(0x33000000))
                                    ) {
                                        Icon(
                                            Icons.Default.PlayArrow,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Caption for the current media
                if (!currentMedia?.caption.isNullOrBlank()) {
                    Text(
                        text = currentMedia!!.caption,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.outline,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 2.dp)
                    )
                }

                // Details Card Container
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        // Title & Price Header Row
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                com.example.ui.screens.ProductBadgePill(
                                    product = product,
                                    modifier = Modifier.padding(bottom = 6.dp)
                                )
                                Text(
                                    text = product.title,
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "฿${String.format("%,.0f", product.price)}",
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Black,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            Text(
                                text = "Seller: ShopHub Store",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Rating: orange star pill + separate review count text (matches mockup)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                color = MaterialTheme.colorScheme.primary,
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Icon(Icons.Default.Star, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "${product.rating}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "(320 Reviews)",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        // Color Selection Section
                        Text(
                            text = "Color",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            colorsList.forEachIndexed { index, color ->
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(color)
                                        .border(
                                            width = if (selectedColorIndex == index) 2.dp else 0.dp,
                                            color = if (selectedColorIndex == index) MaterialTheme.colorScheme.primary else Color.Transparent,
                                            shape = CircleShape
                                        )
                                        .clickable { selectedColorIndex = index }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Text Tabs Header (Description, Specifications, Reviews) — mockup style
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            listOf("Description", "Specifications", "Reviews").forEachIndexed { index, tabTitle ->
                                val isActive = selectedTab == index
                                if (isActive) {
                                    Surface(
                                        onClick = { selectedTab = index },
                                        shape = RoundedCornerShape(20.dp),
                                        color = MaterialTheme.colorScheme.primary
                                    ) {
                                        Text(
                                            text = tabTitle,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                        )
                                    }
                                } else {
                                    Text(
                                        text = tabTitle,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.outline,
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(20.dp))
                                            .clickable { selectedTab = index }
                                            .padding(horizontal = 12.dp, vertical = 8.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Tab Content
                        when (selectedTab) {
                            0 -> Text(
                                text = product.description.ifBlank { "สินค้าคุณภาพสูง ดีไซน์ทันสมัย วัสดุเกรดพรีเมียม สวมใส่สบาย ใช้งานได้ยาวนาน" },
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.outline,
                                lineHeight = 20.sp
                            )
                            1 -> Column {
                                Text("• หมวดหมู่: ${product.category}", fontSize = 13.sp, color = MaterialTheme.colorScheme.outline)
                                Text("• จำนวนคงเหลือ: ${product.stock} ชิ้น", fontSize = 13.sp, color = MaterialTheme.colorScheme.outline)
                                Text("• รับประกันสินค้า 1 ปีเต็ม", fontSize = 13.sp, color = MaterialTheme.colorScheme.outline)
                            }
                            2 -> {
                                ProductReviewsTab(
                                    productId = product.id,
                                    reviews = reviews,
                                    onSubmitReview = onSubmitReview
                                )
                            }
                        }
                    }
                }
            }

            // Bottom Sticky Action Bar (Stepper + Add to Cart Button)
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 8.dp,
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Dark Stepper Pill Container (-  1  +)
                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = Color(0xFF1E1E24)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            IconButton(
                                onClick = { if (quantity > 1) quantity-- },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = "Decrease", tint = Color.White, modifier = Modifier.size(16.dp))
                            }

                            Text(
                                text = "$quantity",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                modifier = Modifier.padding(horizontal = 12.dp)
                            )

                            IconButton(
                                onClick = { if (quantity < product.stock) quantity++ },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Increase", tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Orange Full Pill "Add to Cart" Button
                    Button(
                        onClick = {
                            onAddToCart(product, quantity)
                            onDismiss()
                        },
                        shape = RoundedCornerShape(28.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp)
                            .testTag("add_to_cart_detail_btn")
                    ) {
                        Text(
                            text = "Add to Cart",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductReviewsTab(
    productId: Long,
    reviews: List<com.example.data.ProductReview>,
    onSubmitReview: ((rating: Int, comment: String) -> Unit)?
) {
    var userRating by remember { mutableIntStateOf(5) }
    var commentText by remember { mutableStateOf("") }
    var reviewSubmittedMsg by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Average Rating Summary Header
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.padding(14.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = if (reviews.isNotEmpty()) String.format("%.1f", reviews.map { it.rating }.average()) else "4.8",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = " / 5.0",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                    Text(
                        text = "Based on ${reviews.size + 12} customer reviews",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.outline
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    (1..5).forEach { star ->
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = Color(0xFFFFB300),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }

        // Write a Review Form Card
        Card(
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "Write a Review & Rating",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Interactive Star Rating Picker
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Your Rating:", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    (1..5).forEach { starIndex ->
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Star $starIndex",
                            tint = if (starIndex <= userRating) Color(0xFFFFB300) else Color.LightGray,
                            modifier = Modifier
                                .size(28.dp)
                                .clickable { userRating = starIndex }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Comment Input Field
                OutlinedTextField(
                    value = commentText,
                    onValueChange = { commentText = it },
                    placeholder = { Text("Share your experience with this product...", fontSize = 12.sp) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("review_comment_input"),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                    ),
                    minLines = 2,
                    maxLines = 4
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (reviewSubmittedMsg) {
                        Text(
                            text = "✓ Review submitted! Thank you.",
                            color = Color(0xFF2E7D32),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    } else {
                        Spacer(modifier = Modifier.width(1.dp))
                    }

                    Button(
                        onClick = {
                            if (commentText.isNotBlank()) {
                                onSubmitReview?.invoke(userRating, commentText)
                                commentText = ""
                                reviewSubmittedMsg = true
                            }
                        },
                        enabled = commentText.isNotBlank(),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                        modifier = Modifier.testTag("submit_review_btn")
                    ) {
                        Text("Submit Review", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Reviews List
        Text(
            text = "Customer Feedback",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )

        val defaultReviews = listOf(
            com.example.data.ProductReview(
                productId = productId,
                authorName = "Alex M.",
                rating = 5,
                comment = "Super high quality material! Arrived in 2 days. Fits description 100%.",
                timestamp = "2 days ago"
            ),
            com.example.data.ProductReview(
                productId = productId,
                authorName = "Priya S.",
                rating = 4,
                comment = "Really happy with my purchase. Colors are vivid and nice texture.",
                timestamp = "1 week ago"
            )
        )

        val allDisplayReviews = reviews + defaultReviews

        allDisplayReviews.forEach { review ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.primaryContainer,
                                modifier = Modifier.size(28.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = review.authorName.take(1),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = review.authorName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            (1..5).forEach { s ->
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = if (s <= review.rating) Color(0xFFFFB300) else Color.LightGray,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = review.comment,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 17.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = review.timestamp,
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }
        }
    }
}


