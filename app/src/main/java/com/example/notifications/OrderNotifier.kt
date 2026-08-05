package com.example.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.R

/**
 * Central helper for posting local notifications about order status changes.
 *
 * Handles the notification channel (required on Android 8+) and the runtime
 * POST_NOTIFICATIONS permission check (required on Android 13+).
 */
object OrderNotifier {

    const val CHANNEL_ID = "order_status_updates"
    private const val CHANNEL_NAME = "Order Status Updates"
    private const val CHANNEL_DESCRIPTION =
        "Notifications about the status of your ShopHub orders."

    /**
     * Creates the notification channel. Safe to call multiple times.
     * Should be invoked once at app/activity startup.
     */
    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESCRIPTION
                enableLights(true)
                enableVibration(true)
            }
            val manager = context.getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    /**
     * Returns true if the app is currently allowed to post notifications.
     */
    fun hasPermission(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    /**
     * Posts a notification informing the user that an order's status changed.
     *
     * @param orderCode  the human readable order code, e.g. "SH-12345".
     * @param newStatus  the raw status value (Thai or English) the order moved to.
     */
    fun notifyStatusChange(context: Context, orderCode: String, newStatus: String) {
        createChannel(context)

        if (!hasPermission(context)) return

        val title = "Order #$orderCode"
        val body = statusMessage(newStatus)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setAutoCancel(true)
            .build()

        // Use a stable id per order so repeated updates replace the previous one.
        val notificationId = orderCode.hashCode()
        try {
            NotificationManagerCompat.from(context).notify(notificationId, notification)
        } catch (_: SecurityException) {
            // Permission was revoked between the check above and posting; ignore.
        }
    }

    /**
     * Builds a friendly, localized message for a given order status.
     * Supports both the English (Firestore) and Thai (Room) status vocabularies.
     */
    private fun statusMessage(status: String): String {
        val normalized = status.trim()
        return when {
            normalized.equals("Order Placed", ignoreCase = true) ->
                "🧾 We've received your order and it's being confirmed."
            normalized.equals("Processing", ignoreCase = true) ||
                normalized.contains("กำลังเตรียม") ->
                "📦 Your order is being prepared for shipment."
            normalized.equals("Shipped", ignoreCase = true) ||
                normalized.contains("อยู่ระหว่างจัดส่ง") ->
                "🚚 Your order has been shipped and is on the way!"
            normalized.equals("Delivered", ignoreCase = true) ||
                normalized.contains("จัดส่งสำเร็จ") ->
                "✅ Your order has been delivered. Enjoy!"
            normalized.contains("ยกเลิก") ||
                normalized.equals("Cancelled", ignoreCase = true) ||
                normalized.equals("Canceled", ignoreCase = true) ->
                "❌ Your order has been cancelled."
            else -> "Status updated to: $normalized"
        }
    }
}
