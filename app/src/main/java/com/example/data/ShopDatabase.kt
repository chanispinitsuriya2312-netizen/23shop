package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ProductEntity::class,
        CartItemEntity::class,
        OrderEntity::class,
        ChatMessageEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class ShopDatabase : RoomDatabase() {

    abstract fun shopDao(): ShopDao

    companion object {
        @Volatile
        private var INSTANCE: ShopDatabase? = null

        /** v1 -> v2: add products.mediaJson for the media catalog (images + videos). */
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE products ADD COLUMN mediaJson TEXT NOT NULL DEFAULT ''")
            }
        }

        /** v2 -> v3: add product highlight badge columns (type/text/endsAt). */
        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE products ADD COLUMN badgeType TEXT NOT NULL DEFAULT 'none'")
                db.execSQL("ALTER TABLE products ADD COLUMN badgeText TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE products ADD COLUMN badgeEndsAt INTEGER NOT NULL DEFAULT 0")
            }
        }

        fun getDatabase(context: Context): ShopDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ShopDatabase::class.java,
                    "shophub_database"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .addCallback(DatabaseCallback())
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    CoroutineScope(Dispatchers.IO).launch {
                        populateInitialData(database.shopDao())
                    }
                }
            }
        }

        private suspend fun populateInitialData(dao: ShopDao) {
            val initialProducts = listOf(
                ProductEntity(
                    title = "หูฟังบลูทูธไร้สาย เสียงระดับพรีเมียม ตัดเสียงรบกวน",
                    price = 1290.0,
                    originalPrice = 2590.0,
                    category = "อิเล็กทรอนิกส์",
                    description = "หูฟัง TWS แบตเตอรี่อึดนาน 30 ชั่วโมง พร้อมระบบ Active Noise Cancelling เสียงเบสแน่น คมชัดทุกย่านความถี่ กันน้ำระดับ IPX5",
                    imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                    stock = 25,
                    rating = 4.9f,
                    salesCount = 142,
                    isFeatured = true
                ),
                ProductEntity(
                    title = "นาฬิกา Smart Watch สุขภาพ วัดการนอนและอัตราการเต้นหัวใจ",
                    price = 1890.0,
                    originalPrice = 3200.0,
                    category = "อิเล็กทรอนิกส์",
                    description = "สมาร์ทวอทช์หน้าจอ AMOLED 1.43 นิ้ว ติดตามโหมดออกกำลังกายกว่า 100 โหมด กันน้ำ 5ATM แจ้งเตือนภาษาไทยครบถ้วน รองรับ iOS และ Android",
                    imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
                    stock = 18,
                    rating = 4.8f,
                    salesCount = 98,
                    isFeatured = true
                ),
                ProductEntity(
                    title = "เสื้อเชิ้ตแขนสไตล์มินิมอล ผ้านุ่มระบายอากาศดีเยี่ยม",
                    price = 450.0,
                    originalPrice = 890.0,
                    category = "แฟชั่น",
                    description = "เสื้อเชิ้ตคอจีนทรงสลิมผสานผ้าฝ้ายพรีเมียม ใส่สบาย ไม่ร้อน เหมาะกับสภาพอากาศเมืองไทย สวมใส่ได้ทั้งทำงานและเที่ยวพักผ่อน",
                    imageUrl = "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
                    stock = 40,
                    rating = 4.7f,
                    salesCount = 210,
                    isFeatured = false
                ),
                ProductEntity(
                    title = "กระเป๋าเป้เดินทางกันน้ำ ช่องเก็บของเยอะ น้ำหนักเบา",
                    price = 790.0,
                    originalPrice = 1490.0,
                    category = "แฟชั่น",
                    description = "กระเป๋าเป้สะพายหลังพรีเมียม มีช่องใส่โน้ตบุ๊กขนาด 15.6 นิ้ว ซิปซ่อนกันขโมย พร้อมช่องเสียบชาร์จ USB ด้านนอก",
                    imageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
                    stock = 15,
                    rating = 4.9f,
                    salesCount = 85,
                    isFeatured = true
                ),
                ProductEntity(
                    title = "แก้วน้ำเก็บอุณหภูมิ สแตนเลส 304 เก็บความเย็นนาน 24 ชั่วโมง",
                    price = 390.0,
                    originalPrice = 690.0,
                    category = "ของใช้ในบ้าน",
                    description = "แก้วเก็บความเย็นพรีเมียม ขนาด 30 ออนซ์ ไร้ไอน้ำเกาะรอบแก้ว สแตนเลสฟู้ดเกรด ปลอดภัย ไร้กลิ่นตกค้าง",
                    imageUrl = "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80",
                    stock = 50,
                    rating = 4.8f,
                    salesCount = 320,
                    isFeatured = true
                ),
                ProductEntity(
                    title = "โคมไฟมินิมอล ปรับแสงได้ 3 โทน ชาร์จไฟในตัว",
                    price = 520.0,
                    originalPrice = 990.0,
                    category = "ของใช้ในบ้าน",
                    description = "โคมไฟตั้งโต๊ะมินิมอล ให้แสงสว่างถนอมสายตา ปรับระดับความสว่างสัมผัส พกพาสะดวก ตกแต่งห้องนอนหรือโต๊ะทำงานได้สวยงาม",
                    imageUrl = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
                    stock = 30,
                    rating = 4.6f,
                    salesCount = 76,
                    isFeatured = false
                ),
                ProductEntity(
                    title = "เซรั่มบำรุงผิวหน้าไฮยาลูรอน ผิวนุ่มชุ่มชื้น กระจ่างใส",
                    price = 690.0,
                    originalPrice = 1290.0,
                    category = "ความงาม",
                    description = "เซรั่มสูตรเข้มข้นช่วยฟื้นฟูผิวแห้งกร้าน รูขุมขนกระชับ อ่อนโยนต่อทุกสภาพผิว ไม่มีส่วนผสมของแอลกอฮอล์และพาราเบน",
                    imageUrl = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
                    stock = 22,
                    rating = 4.9f,
                    salesCount = 189,
                    isFeatured = true
                ),
                ProductEntity(
                    title = "กาแฟสกัดเย็น ออร์แกนิก หอมเข้มข้น ดื่มสดชื่น",
                    price = 280.0,
                    originalPrice = 450.0,
                    category = "อาหารและเครื่องดื่ม",
                    description = "กาแฟ Cold Brew สกัดเย็นจากเมล็ดอาราบิก้าแท้ 100% ให้รสชาตินุ่มลึก ไร้ความกรดกัดกระเพาะ บรรจุขวดทรงเก๋พร้อมดื่ม",
                    imageUrl = "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80",
                    stock = 35,
                    rating = 4.8f,
                    salesCount = 150,
                    isFeatured = false
                )
            )

            for (p in initialProducts) {
                dao.insertProduct(p)
            }

            // Initial Chat welcome message
            dao.insertChatMessage(
                ChatMessageEntity(
                    sender = "store",
                    message = "สวัสดีครับ ยินดีต้อนรับสู่ ShopHub! มีสินค้าชิ้นไหนสนใจ หรือต้องการสอบถามรายละเอียด เพิ่มเติม สามารถทักแชทสอบถามทางร้านได้เลยครับ 🙏😊"
                )
            )

            // Initial sample order for order tracking demonstration
            dao.insertOrder(
                OrderEntity(
                    orderCode = "SH-98124",
                    customerName = "คุณสมชาย ใจดี",
                    customerPhone = "081-234-5678",
                    shippingAddress = "99/1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
                    paymentMethod = "โอนเงินผ่าน PromptPay",
                    totalAmount = 2170.0,
                    status = "อยู่ระหว่างจัดส่ง",
                    itemsSummary = "หูฟังบลูทูธไร้สาย x1, แก้วน้ำเก็บอุณหภูมิ x2",
                    timestamp = System.currentTimeMillis() - 86400000L
                )
            )
        }
    }
}
