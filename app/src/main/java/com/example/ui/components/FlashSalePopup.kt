package com.example.ui.components

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.core.graphics.toColorInt
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.Campaign
import com.example.data.CampaignLogic
import kotlinx.coroutines.delay

private const val PREFS_NAME = "shophub_campaign"
private const val KEY_DISMISSED = "dismissed_campaign_id"

/**
 * Host that decides whether to show the flash-sale popup. It appears once per
 * campaign id (dismissal is remembered in SharedPreferences), only while the
 * campaign is live. Mount near the app root on the storefront.
 */
@Composable
fun FlashSaleHost(campaign: Campaign) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE) }

    var visible by remember(campaign.id) {
        val alreadyDismissed = prefs.getString(KEY_DISMISSED, "") == campaign.id
        mutableStateOf(CampaignLogic.isLive(campaign) && !alreadyDismissed)
    }

    if (visible && CampaignLogic.isLive(campaign)) {
        FlashSaleDialog(
            campaign = campaign,
            onDismiss = {
                prefs.edit().putString(KEY_DISMISSED, campaign.id).apply()
                visible = false
            }
        )
    }
}

@Composable
fun FlashSaleDialog(campaign: Campaign, onDismiss: () -> Unit) {
    val clipboard: ClipboardManager = LocalClipboardManager.current
    val accent = remember(campaign.accent) {
        runCatching { Color(campaign.accent.toColorInt()) }.getOrDefault(Color(0xFF4F46E5))
    }

    var remaining by remember(campaign.id) {
        mutableLongStateOf(campaign.endsAt - System.currentTimeMillis())
    }
    LaunchedEffect(campaign.id) {
        while (remaining > 0) {
            remaining = campaign.endsAt - System.currentTimeMillis()
            delay(1000)
        }
    }
    val cd = CampaignLogic.countdown(remaining)

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(24.dp)) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Gradient header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .background(
                            Brush.horizontalGradient(listOf(accent, Color(0xFFE11D48)))
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("⚡", fontSize = 40.sp)
                        Text(
                            text = campaign.title,
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                    }
                }

                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = campaign.subtitle,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Countdown clock
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CountdownCell(cd.days, "วัน", accent)
                        CountdownCell(cd.hours, "ชม.", accent)
                        CountdownCell(cd.minutes, "นาที", accent)
                        CountdownCell(cd.seconds, "วิ", accent)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Promo code (copyable)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                RoundedCornerShape(12.dp)
                            )
                            .padding(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "โค้ดส่วนลด",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.outline
                            )
                            Text(
                                text = campaign.promoCode,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = accent
                            )
                        }
                        TextButton(onClick = {
                            clipboard.setText(AnnotatedString(campaign.promoCode))
                        }) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "คัดลอกโค้ด",
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("คัดลอก", fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = accent),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = campaign.ctaText,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }

                    TextButton(onClick = onDismiss) {
                        Text("ไว้ครั้งหน้า", fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
                    }
                }
            }
        }
    }
}

@Composable
private fun CountdownCell(value: Long, label: String, accent: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(width = 52.dp, height = 52.dp)
                .background(accent.copy(alpha = 0.12f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = String.format("%02d", value),
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                color = accent
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = label, fontSize = 10.sp, color = MaterialTheme.colorScheme.outline)
    }
}
