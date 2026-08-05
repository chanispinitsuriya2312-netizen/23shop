package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.animation.Crossfade
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.R
import com.example.data.BadgeLogic
import com.example.data.CampaignLogic
import com.example.data.HeroConfig
import com.example.data.ProductEntity
import com.example.ui.ShopViewModel
import com.example.ui.theme.parseHexColor
import com.example.ui.theme.shade
import kotlinx.coroutines.delay

@Composable
fun StorefrontScreen(
    viewModel: ShopViewModel,
    onProductClick: (ProductEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    val products by viewModel.products.collectAsStateWithLifecycle()
    val selectedCategory by viewModel.selectedCategory.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val campaign by viewModel.campaign.collectAsStateWithLifecycle()
    val hero by viewModel.hero.collectAsStateWithLifecycle()

    val categories = listOf(
        CategoryItem("ทั้งหมด", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150"),
        CategoryItem("แฟชั่น", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150"),
        CategoryItem("อิเล็กทรอนิกส์", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150"),
        CategoryItem("ของใช้ในบ้าน", "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=150"),
        CategoryItem("ความงาม", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150")
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Search & Filter Header
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.updateSearchQuery(it) },
                modifier = Modifier
                    .weight(1f)
                    .testTag("search_input"),
                placeholder = { Text("Search...", fontSize = 14.sp, color = Color.Gray) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = Color.Gray
                    )
                },
                trailingIcon = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(end = 6.dp)
                    ) {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                        // Vertical divider separating the search field from the filter action
                        Box(
                            modifier = Modifier
                                .padding(horizontal = 2.dp)
                                .size(width = 1.dp, height = 24.dp)
                                .background(MaterialTheme.colorScheme.outlineVariant)
                        )
                        IconButton(
                            onClick = { /* Open filter options */ },
                            modifier = Modifier.testTag("search_filter_btn")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Tune,
                                contentDescription = "Filter",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(24.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = Color.Transparent,
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface
                )
            )
        }

        // Main Content List / Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(bottom = 16.dp, start = 16.dp, end = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            // Hero Promo Banner
            if (searchQuery.isEmpty() && selectedCategory == "ทั้งหมด") {
                item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
                    HeroSlider(hero = hero)
                }

                // Circular Category Horizontal Selector
                item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
                    Column(modifier = Modifier.padding(vertical = 4.dp)) {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            contentPadding = PaddingValues(horizontal = 4.dp)
                        ) {
                            items(categories) { item ->
                                val isSelected = item.name == selectedCategory
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .clickable { viewModel.selectCategory(item.name) }
                                ) {
                                    Surface(
                                        shape = CircleShape,
                                        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
                                        border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null,
                                        modifier = Modifier.size(60.dp)
                                    ) {
                                        AsyncImage(
                                            model = ImageRequest.Builder(LocalContext.current)
                                                .data(item.imageUrl)
                                                .crossfade(true)
                                                .build(),
                                            contentDescription = item.name,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.clip(CircleShape)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = item.name,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }

                // Section Title: "Special For You"
                item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp, bottom = 4.dp)
                    ) {
                        Text(
                            text = "Special For You",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "See all",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.outline,
                            modifier = Modifier.clickable { viewModel.selectCategory("ทั้งหมด") }
                        )
                    }
                }
            }

            if (products.isEmpty()) {
                item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(48.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.ShoppingBag,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.outline
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "ไม่พบสินค้าในหมวดหมู่นี้",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(products, key = { it.id }) { product ->
                    ProductCardItem(
                        product = product,
                        onSale = CampaignLogic.isProductInCampaign(campaign, product.id),
                        saleLabel = CampaignLogic.productBadgeLabel(campaign),
                        onClick = { onProductClick(product) }
                    )
                }
            }
        }
    }
}

data class CategoryItem(val name: String, val imageUrl: String)

/** Extracts hex colours from a CSS-ish bg string to build a Compose gradient. */
private fun heroGradient(bg: String, fallback: List<Color>): List<Color> {
    val cols = Regex("#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})")
        .findAll(bg)
        .map { parseHexColor(it.value, fallback.first()) }
        .toList()
    return when {
        cols.size >= 2 -> cols
        cols.size == 1 -> listOf(cols[0], cols[0].shade(-0.15f))
        else -> fallback
    }
}

/** Config-driven hero banner: auto-rotating slides read live from config/hero. */
@Composable
fun HeroSlider(hero: HeroConfig) {
    val slides = hero.slides
    if (slides.isEmpty()) {
        PromoHeroCard()
        return
    }
    var index by remember { mutableIntStateOf(0) }
    if (index >= slides.size) index = 0

    // Auto-rotate when there is more than one slide.
    LaunchedEffect(slides.size, hero.autoPlayMs) {
        if (slides.size > 1 && hero.autoPlayMs > 0) {
            while (true) {
                delay(hero.autoPlayMs)
                index = (index + 1) % slides.size
            }
        }
    }

    val fallback = listOf(
        MaterialTheme.colorScheme.primary,
        MaterialTheme.colorScheme.primary.shade(-0.15f)
    )

    Card(
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(170.dp)
            .clickable { index = (index + 1) % slides.size }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
        Crossfade(targetState = index, label = "hero") { i ->
            val slide = slides[i.coerceIn(0, slides.size - 1)]
            val colors = heroGradient(slide.bg, fallback)
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Brush.horizontalGradient(colors))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.Center
                ) {
                    if (slide.title.isNotBlank()) {
                        Text(
                            text = slide.title,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            lineHeight = 24.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    if (slide.subtitle.isNotBlank()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = slide.subtitle,
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.92f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    if (slide.ctaText.isNotBlank()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color.White
                        ) {
                            Text(
                                text = slide.ctaText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = colors.first(),
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
            }
        }

        // Pagination dots
        if (slides.size > 1) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(bottom = 10.dp, start = 24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                slides.forEachIndexed { i, _ ->
                    Box(
                        modifier = Modifier
                            .size(height = 6.dp, width = if (i == index) 16.dp else 6.dp)
                            .clip(CircleShape)
                            .background(if (i == index) Color.White else Color.White.copy(alpha = 0.5f))
                    )
                }
            }
        }
        }
    }
}

/** Highlight pill for a product (managed from the web admin), with live countdown for promos. */
@Composable
fun ProductBadgePill(product: ProductEntity, modifier: Modifier = Modifier) {
    val badge = remember(product.badgeType, product.badgeText, product.badgeEndsAt) {
        com.example.data.ProductBadge(product.badgeType, product.badgeText, product.badgeEndsAt)
    }
    if (badge.type == "none") return

    val usesCountdown = BadgeLogic.usesCountdown(badge.type)
    var now by remember { mutableStateOf(System.currentTimeMillis()) }
    if (usesCountdown) {
        LaunchedEffect(badge.endsAt) {
            while (true) {
                now = System.currentTimeMillis()
                delay(1000)
            }
        }
    }

    val remaining = badge.endsAt - now
    val active = if (usesCountdown) remaining > 0 else badge.type != "none"
    if (!active) return

    val meta = BadgeLogic.meta(badge.type)
    val text = if (usesCountdown) {
        "${meta.emoji} ${BadgeLogic.formatCountdown(remaining)}"
    } else {
        BadgeLogic.label(badge)
    }

    Surface(
        shape = RoundedCornerShape(10.dp),
        color = Color(meta.color),
        modifier = modifier
    ) {
        Text(
            text = text,
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            maxLines = 1,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun PromoHeroCard() {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF2ECE6)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(160.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1.2f)) {
                    Text(
                        text = "Super Sale\nDiscount\nUp to 50%",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF1E1E24),
                        lineHeight = 22.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { /* Shop now action */ },
                        shape = RoundedCornerShape(20.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Shop Now",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = Color.White
                        )
                    }
                }

                // Hero Image
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.img_hero_banner_1785429481833),
                        contentDescription = "Promo Shoes Banner",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(16.dp))
                    )
                }
            }

            // Pagination Dots
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 20.dp, bottom = 10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(height = 6.dp, width = 16.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary)
                )
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Color.LightGray)
                )
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Color.LightGray)
                )
            }
        }
    }
}

@Composable
fun ProductCardItem(
    product: ProductEntity,
    onClick: () -> Unit,
    onSale: Boolean = false,
    saleLabel: String = ""
) {
    val context = LocalContext.current
    var isFavorite by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("product_card_${product.id}")
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            // Image Box with Top Right Heart Button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFFF6F6F8))
            ) {
                AsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(product.imageUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = product.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Orange Circle Heart Favorite Button
                Surface(
                    onClick = { isFavorite = !isFavorite },
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(30.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Favorite",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                // Flash-sale badge for products in a product-scoped campaign
                if (onSale) {
                    Surface(
                        shape = RoundedCornerShape(bottomEnd = 12.dp, topStart = 16.dp),
                        color = Color(0xFFE11D48),
                        modifier = Modifier.align(Alignment.TopStart)
                    ) {
                        Text(
                            text = "🔥 $saleLabel",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                // Manual highlight badge (managed from the web admin per product)
                ProductBadgePill(
                    product = product,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(6.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Title
            Text(
                text = product.title,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Price (matches mockup: price only, no inline add button)
            Text(
                text = "฿${String.format("%,.0f", product.price)}",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Color Preview Swatches (as shown in reference image design)
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF800020))
                )
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1E1E24))
                )
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1D4ED8))
                )
                Text(
                    text = "+2",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.outline,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

