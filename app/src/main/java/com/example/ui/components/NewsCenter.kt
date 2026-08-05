package com.example.ui.components

import android.content.Context
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.News
import com.example.data.NewsCategories
import com.example.data.ThemeConfig
import com.example.ui.theme.parseHexColor

private const val NEWS_PREFS = "shophub_news"
private const val NEWS_READ_KEY = "read_ids"

/** อ่านชุด id ที่ "อ่านแล้ว" จากเครื่องผู้ใช้ (ไม่เก็บใน Firestore). */
private fun loadReadIds(context: Context): Set<String> =
    context.getSharedPreferences(NEWS_PREFS, Context.MODE_PRIVATE)
        .getStringSet(NEWS_READ_KEY, emptySet())
        ?.toSet() ?: emptySet()

private fun saveReadIds(context: Context, ids: Set<String>) {
    context.getSharedPreferences(NEWS_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putStringSet(NEWS_READ_KEY, ids)
        .apply()
}

/**
 * ศูนย์ข่าวสาร / แจ้งเตือน — ปุ่มไอคอนคูปองลอย + จุดแดงกระพริบบอกข่าวที่ยังไม่อ่าน
 * แตะแล้วเปิดป๊อบอัพที่มีแท็บ (ทั้งหมด/ยังไม่อ่าน/หมวด) + การ์ดข่าว 4:3 → หน้ารายละเอียด.
 *
 * แชร์ข้อมูลกับเว็บผ่าน Firestore collection `news` (แอดมินจัดการจากหลังบ้านเว็บ).
 * ตำแหน่ง/เปิด-ปิด อ่านจาก config/theme (newsPosition / newsEnabled) เหมือนเว็บ.
 * ซ่อนอัตโนมัติเมื่อปิดใช้งานหรือไม่มีข่าว active.
 *
 * @param onOpenProduct เรียกเมื่อกด "ดูสินค้า" (ส่ง productId ที่ผูกไว้)
 */
@Composable
fun NewsCenterHost(
    news: List<News>,
    theme: ThemeConfig,
    onOpenProduct: (String) -> Unit
) {
    if (!theme.newsEnabled || news.isEmpty()) return

    val context = LocalContext.current
    val accent = parseHexColor(theme.primaryColor, Color(0xFFFF5722))

    var readIds by remember { mutableStateOf(loadReadIds(context)) }
    var open by remember { mutableStateOf(false) }
    var detail by remember { mutableStateOf<News?>(null) }

    val unread = news.count { it.id !in readIds }

    val topAlign = theme.newsPosition == "top-right"
    val alignment = if (topAlign) Alignment.TopEnd else Alignment.BottomEnd
    val outerPadding = if (topAlign) {
        Modifier.padding(top = 12.dp, end = 12.dp)
    } else {
        Modifier.padding(bottom = 92.dp, end = 12.dp)
    }

    fun markRead(id: String) {
        if (id.isNotBlank() && id !in readIds) {
            val next = readIds + id
            readIds = next
            saveReadIds(context, next)
        }
    }

    fun markAllRead() {
        val next = readIds + news.map { it.id }
        readIds = next
        saveReadIds(context, next)
    }

    // ปุ่มลอย
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = alignment) {
        Box(modifier = outerPadding) {
            Surface(
                onClick = { open = true },
                shape = CircleShape,
                color = accent,
                shadowElevation = 8.dp,
                modifier = Modifier
                    .size(56.dp)
                    .testTag("news_center_button")
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Filled.LocalOffer,
                        contentDescription = "ศูนย์ข่าวสาร",
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
            if (unread > 0) {
                // ไฟกระพริบเล็กน้อย เมื่ออ่านแล้วจะหาย
                val transition = rememberInfiniteTransition(label = "newsBlink")
                val alpha by transition.animateFloat(
                    initialValue = 1f,
                    targetValue = 0.25f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(700),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "newsBlinkAlpha"
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(2.dp)
                        .size(20.dp)
                        .background(Color(0xFFEF4444).copy(alpha = alpha), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (unread > 9) "9+" else unread.toString(),
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }

    if (open) {
        val current = detail
        Dialog(
            onDismissRequest = { open = false; detail = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Card(
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .heightIn(max = 560.dp)
            ) {
                if (current == null) {
                    NewsList(
                        news = news,
                        readIds = readIds,
                        accent = accent,
                        onOpen = { item -> markRead(item.id); detail = item },
                        onReadAll = { markAllRead() },
                        onClose = { open = false }
                    )
                } else {
                    NewsDetail(
                        item = current,
                        accent = accent,
                        onBack = { detail = null },
                        onOpenProduct = { pid -> open = false; detail = null; onOpenProduct(pid) },
                        onClose = { open = false; detail = null }
                    )
                }
            }
        }
    }
}

@Composable
private fun NewsList(
    news: List<News>,
    readIds: Set<String>,
    accent: Color,
    onOpen: (News) -> Unit,
    onReadAll: () -> Unit,
    onClose: () -> Unit
) {
    var selected by remember { mutableStateOf("all") } // all | unread | <categoryKey>

    val filtered = when (selected) {
        "all" -> news
        "unread" -> news.filter { it.id !in readIds }
        else -> news.filter { it.category == selected }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        // Header ไล่สี
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(listOf(accent, accent.copy(alpha = 0.75f))))
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Filled.LocalOffer,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "ศูนย์ข่าวสาร",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "อ่านทั้งหมด",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onReadAll() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
                Spacer(Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.Filled.Close,
                    contentDescription = "ปิด",
                    tint = Color.White,
                    modifier = Modifier
                        .size(22.dp)
                        .clip(CircleShape)
                        .clickable { onClose() }
                )
            }
        }

        // แท็บ (ทั้งหมด / ยังไม่อ่าน / หมวดที่มีข่าว)
        val unreadCount = news.count { it.id !in readIds }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            NewsTab("ทั้งหมด", selected == "all", accent) { selected = "all" }
            NewsTab(
                if (unreadCount > 0) "ยังไม่อ่าน ($unreadCount)" else "ยังไม่อ่าน",
                selected == "unread",
                accent
            ) { selected = "unread" }
            NewsCategories.present(news).forEach { cat ->
                NewsTab(cat.label, selected == cat.key, accent) { selected = cat.key }
            }
        }

        // รายการข่าว
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 12.dp)
                .padding(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (filtered.isEmpty()) {
                Text(
                    text = "ยังไม่มีข่าวในหมวดนี้",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.padding(vertical = 24.dp)
                )
            } else {
                filtered.forEach { item ->
                    NewsCard(
                        item = item,
                        read = item.id in readIds,
                        accent = accent,
                        onClick = { onOpen(item) }
                    )
                }
            }
        }
    }
}

@Composable
private fun NewsTab(label: String, active: Boolean, accent: Color, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        color = if (active) accent else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
            color = if (active) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
        )
    }
}

@Composable
private fun NewsCard(item: News, read: Boolean, accent: Color, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
        )
    ) {
        Row(modifier = Modifier.padding(10.dp)) {
            NewsThumb(item.imageUrl, accent, Modifier.width(96.dp))
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CategoryBadge(item.category, accent)
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (read) "อ่านแล้ว" else "ใหม่",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (read) MaterialTheme.colorScheme.outline else Color(0xFFEF4444)
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = item.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (item.shortDesc.isNotBlank()) {
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = item.shortDesc,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "ดูเพิ่มเติม",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = accent
                )
            }
        }
    }
}

@Composable
private fun NewsDetail(
    item: News,
    accent: Color,
    onBack: () -> Unit,
    onOpenProduct: (String) -> Unit,
    onClose: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "ย้อนกลับ",
                tint = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .clickable { onBack() }
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = "รายละเอียด",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.weight(1f)
            )
            Icon(
                imageVector = Icons.Filled.Close,
                contentDescription = "ปิด",
                tint = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier
                    .size(22.dp)
                    .clip(CircleShape)
                    .clickable { onClose() }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(bottom = 20.dp)
        ) {
            NewsThumb(
                item.imageUrl,
                accent,
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
            )
            Spacer(Modifier.height(12.dp))
            CategoryBadge(item.category, accent)
            Spacer(Modifier.height(8.dp))
            Text(
                text = item.title,
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(10.dp))
            val bodyText = item.body.ifBlank { item.shortDesc }
            if (bodyText.isNotBlank()) {
                Text(
                    text = bodyText,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (item.productId.isNotBlank()) {
                Spacer(Modifier.height(16.dp))
                Surface(
                    onClick = { onOpenProduct(item.productId) },
                    shape = RoundedCornerShape(12.dp),
                    color = accent,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("news_view_product")
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Filled.ShoppingBag,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "ดูสินค้า",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

/** รูปข่าวอัตราส่วน 4:3 (มี placeholder ไอคอนคูปองเมื่อไม่มีรูป). */
@Composable
private fun NewsThumb(imageUrl: String, accent: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .aspectRatio(4f / 3f)
            .clip(RoundedCornerShape(10.dp))
            .background(accent.copy(alpha = 0.12f)),
        contentAlignment = Alignment.Center
    ) {
        if (imageUrl.isNotBlank()) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current).data(imageUrl).crossfade(true).build(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Icon(
                imageVector = Icons.Filled.LocalOffer,
                contentDescription = null,
                tint = accent.copy(alpha = 0.6f),
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

@Composable
private fun CategoryBadge(category: String, accent: Color) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = accent.copy(alpha = 0.15f)
    ) {
        Text(
            text = NewsCategories.label(category),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = accent,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}
