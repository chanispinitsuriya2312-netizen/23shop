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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
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
import com.example.data.ProductMedia

/** Editable draft of a gallery media item inside the admin form. */
private data class MediaDraft(val type: String, val url: String, val caption: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditProductDialog(
    productToEdit: ProductEntity?,
    onDismiss: () -> Unit,
    onSaveProduct: (ProductEntity) -> Unit
) {
    val context = LocalContext.current

    var title by remember { mutableStateOf(productToEdit?.title ?: "") }
    var priceText by remember { mutableStateOf(productToEdit?.price?.let { if (it > 0) it.toInt().toString() else "" } ?: "") }
    var originalPriceText by remember { mutableStateOf(productToEdit?.originalPrice?.let { if (it > 0) it.toInt().toString() else "" } ?: "") }
    var category by remember { mutableStateOf(productToEdit?.category ?: "แฟชั่น") }
    var description by remember { mutableStateOf(productToEdit?.description ?: "") }
    var stockText by remember { mutableStateOf(productToEdit?.stock?.toString() ?: "10") }
    var imageUrl by remember { mutableStateOf(productToEdit?.imageUrl ?: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80") }

    // Extra media gallery (images + videos with captions). Parsed WITHOUT imageUrl
    // fallback so the main image above isn't duplicated as a row.
    val mediaItems = remember {
        mutableStateListOf<MediaDraft>().apply {
            addAll(
                ProductMedia.parse(productToEdit?.mediaJson ?: "", "")
                    .map { MediaDraft(it.type, it.url, it.caption) }
            )
        }
    }

    val categories = listOf("แฟชั่น", "อิเล็กทรอนิกส์", "ของใช้ในบ้าน", "อาหารและเครื่องดื่ม", "ความงาม")
    var categoryExpanded by remember { mutableStateOf(false) }

    // Preset High Quality Image Options for easy selection
    val presetImages = listOf(
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", // Watch
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", // Headphone
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80", // Shirt
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80", // Backpack
        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80", // Tumbler
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80", // Serum
        "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80", // Coffee
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"  // Sneakers
    )

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp)
                .padding(bottom = 28.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (productToEdit == null || productToEdit.id == 0L) "เพิ่มสินค้าใหม่ลงร้านค้า" else "แก้ไขข้อมูลสินค้า",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close")
                }
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

            // Image Preview & Picker
            Text("รูปภาพสินค้า (อัปโหลด / เลือกรูปตัวอย่าง)", fontWeight = FontWeight.Bold, fontSize = 13.sp)

            Spacer(modifier = Modifier.height(8.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center
            ) {
                if (imageUrl.isNotBlank()) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(imageUrl).crossfade(true).build(),
                        contentDescription = "Product Image Preview",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, modifier = Modifier.size(40.dp))
                        Text("ใส่ URL รูปภาพ หรือเลือกจากด้านล่าง", fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Preset Image Row
            Text("เลือกรูปภาพสำเร็จรูป:", fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
            Spacer(modifier = Modifier.height(4.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(presetImages) { url ->
                    val isSelected = url == imageUrl
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(
                                width = if (isSelected) 3.dp else 1.dp,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.LightGray,
                                shape = RoundedCornerShape(8.dp)
                            )
                            .clickable { imageUrl = url }
                    ) {
                        AsyncImage(
                            model = url,
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxWidth()
                        )
                        if (isSelected) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.4f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Manual Image URL Text Field
            OutlinedTextField(
                value = imageUrl,
                onValueChange = { imageUrl = it },
                label = { Text("URL รูปภาพสินค้า / ลิงก์รูปภาพ") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("admin_image_url_input"),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Media gallery editor (extra images + videos with captions)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("แคตตาล็อกสื่อ (ภาพ / วิดีโอ เพิ่มเติม)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Surface(
                        onClick = { mediaItems.add(MediaDraft("image", "", "")) },
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                            Text(" ภาพ", fontSize = 12.sp)
                        }
                    }
                    Surface(
                        onClick = { mediaItems.add(MediaDraft("video", "", "")) },
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(14.dp))
                            Text(" วิดีโอ", fontSize = 12.sp)
                        }
                    }
                }
            }

            if (mediaItems.isEmpty()) {
                Text(
                    "ยังไม่มีสื่อเพิ่มเติม — รูปหลักด้านบนจะถูกใช้เป็นภาพแรก",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.padding(vertical = 6.dp)
                )
            }

            mediaItems.forEachIndexed { i, item ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                        .padding(8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = (if (item.type == "video") "🎬 วิดีโอ #" else "🖼️ ภาพ #") + (i + 1),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        IconButton(onClick = { mediaItems.removeAt(i) }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Delete, contentDescription = "ลบสื่อ", tint = Color(0xFFD32F2F), modifier = Modifier.size(18.dp))
                        }
                    }
                    OutlinedTextField(
                        value = item.url,
                        onValueChange = { mediaItems[i] = item.copy(url = it) },
                        label = { Text(if (item.type == "video") "ลิงก์ YouTube หรือ .mp4" else "ลิงก์รูปภาพ (URL)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = item.caption,
                        onValueChange = { mediaItems[i] = item.copy(caption = it) },
                        label = { Text("คำบรรยายภาพ (ไม่บังคับ)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Title Field
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("ชื่อสินค้า *") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("admin_title_input"),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Category Dropdown
            ExposedDropdownMenuBox(
                expanded = categoryExpanded,
                onExpandedChange = { categoryExpanded = !categoryExpanded }
            ) {
                OutlinedTextField(
                    value = category,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("หมวดหมู่สินค้า") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded) },
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                ExposedDropdownMenu(
                    expanded = categoryExpanded,
                    onDismissRequest = { categoryExpanded = false }
                ) {
                    categories.forEach { cat ->
                        DropdownMenuItem(
                            text = { Text(cat) },
                            onClick = {
                                category = cat
                                categoryExpanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Price and Stock Row
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = priceText,
                    onValueChange = { priceText = it },
                    label = { Text("ราคาขาย (บาท) *") },
                    singleLine = true,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("admin_price_input"),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = originalPriceText,
                    onValueChange = { originalPriceText = it },
                    label = { Text("ราคาเต็มก่อนลด") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = stockText,
                onValueChange = { stockText = it },
                label = { Text("จำนวนในคลังสินค้า") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Description text
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("รายละเอียดสินค้า (ข้อความอธิบายคุณสมบัติ)") },
                maxLines = 4,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("admin_description_input"),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Submit Button
            Button(
                onClick = {
                    val priceVal = priceText.toDoubleOrNull() ?: 0.0
                    val origVal = originalPriceText.toDoubleOrNull() ?: 0.0
                    val stockVal = stockText.toIntOrNull() ?: 10

                    if (title.isNotBlank() && priceVal > 0) {
                        val mediaModels = mediaItems
                            .filter { it.url.isNotBlank() }
                            .map { ProductMedia(it.type, it.url, it.caption) }
                        val mediaJson = ProductMedia.toJson(mediaModels)
                        val firstImage = mediaModels.firstOrNull { !it.isVideo }?.url
                        val finalImageUrl = imageUrl.ifBlank {
                            firstImage ?: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                        }
                        val newProduct = ProductEntity(
                            id = productToEdit?.id ?: 0L,
                            title = title,
                            price = priceVal,
                            originalPrice = origVal,
                            category = category,
                            description = description,
                            imageUrl = finalImageUrl,
                            mediaJson = mediaJson,
                            stock = stockVal,
                            rating = productToEdit?.rating ?: 5.0f,
                            salesCount = productToEdit?.salesCount ?: 0,
                            isFeatured = productToEdit?.isFeatured ?: false
                        )
                        onSaveProduct(newProduct)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("save_product_btn"),
                shape = RoundedCornerShape(25.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Save, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("บันทึกข้อมูลสินค้า", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}
