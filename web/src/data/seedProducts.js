// Shared seed product catalog — mirrors the Android app's initial Room data
// (com/example/data/ShopDatabase.kt). Schema aligns with FirestoreProductInventory.
export const seedProducts = [
  {
    productId: 1,
    title: 'หูฟังบลูทูธไร้สาย เสียงระดับพรีเมียม ตัดเสียงรบกวน',
    price: 1290.0,
    originalPrice: 2590.0,
    category: 'อิเล็กทรอนิกส์',
    description:
      'หูฟัง TWS แบตเตอรี่อึดนาน 30 ชั่วโมง พร้อมระบบ Active Noise Cancelling เสียงเบสแน่น คมชัดทุกย่านความถี่ กันน้ำระดับ IPX5',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    stock: 25,
    rating: 4.9,
    salesCount: 142,
    isFeatured: true
  },
  {
    productId: 2,
    title: 'นาฬิกา Smart Watch สุขภาพ วัดการนอนและอัตราการเต้นหัวใจ',
    price: 1890.0,
    originalPrice: 3200.0,
    category: 'อิเล็กทรอนิกส์',
    description:
      'สมาร์ทวอทช์หน้าจอ AMOLED 1.43 นิ้ว ติดตามโหมดออกกำลังกายกว่า 100 โหมด กันน้ำ 5ATM แจ้งเตือนภาษาไทยครบถ้วน รองรับ iOS และ Android',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    stock: 18,
    rating: 4.8,
    salesCount: 98,
    isFeatured: true
  },
  {
    productId: 3,
    title: 'เสื้อเชิ้ตแขนสไตล์มินิมอล ผ้านุ่มระบายอากาศดีเยี่ยม',
    price: 450.0,
    originalPrice: 890.0,
    category: 'แฟชั่น',
    description:
      'เสื้อเชิ้ตคอจีนทรงสลิมผสานผ้าฝ้ายพรีเมียม ใส่สบาย ไม่ร้อน เหมาะกับสภาพอากาศเมืองไทย สวมใส่ได้ทั้งทำงานและเที่ยวพักผ่อน',
    imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80',
    stock: 40,
    rating: 4.7,
    salesCount: 210,
    isFeatured: false
  },
  {
    productId: 4,
    title: 'กระเป๋าเป้เดินทางกันน้ำ ช่องเก็บของเยอะ น้ำหนักเบา',
    price: 790.0,
    originalPrice: 1490.0,
    category: 'แฟชั่น',
    description:
      'กระเป๋าเป้สะพายหลังพรีเมียม มีช่องใส่โน้ตบุ๊กขนาด 15.6 นิ้ว ซิปซ่อนกันขโมย พร้อมช่องเสียบชาร์จ USB ด้านนอก',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    stock: 15,
    rating: 4.9,
    salesCount: 85,
    isFeatured: true
  },
  {
    productId: 5,
    title: 'แก้วน้ำเก็บอุณหภูมิ สแตนเลส 304 เก็บความเย็นนาน 24 ชั่วโมง',
    price: 390.0,
    originalPrice: 690.0,
    category: 'ของใช้ในบ้าน',
    description:
      'แก้วเก็บความเย็นพรีเมียม ขนาด 30 ออนซ์ ไร้ไอน้ำเกาะรอบแก้ว สแตนเลสฟู้ดเกรด ปลอดภัย ไร้กลิ่นตกค้าง',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80',
    stock: 50,
    rating: 4.8,
    salesCount: 320,
    isFeatured: true
  },
  {
    productId: 6,
    title: 'โคมไฟมินิมอล ปรับแสงได้ 3 โทน ชาร์จไฟในตัว',
    price: 520.0,
    originalPrice: 990.0,
    category: 'ของใช้ในบ้าน',
    description:
      'โคมไฟตั้งโต๊ะมินิมอล ให้แสงสว่างถนอมสายตา ปรับระดับความสว่างสัมผัส พกพาสะดวก ตกแต่งห้องนอนหรือโต๊ะทำงานได้สวยงาม',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    stock: 30,
    rating: 4.6,
    salesCount: 76,
    isFeatured: false
  },
  {
    productId: 7,
    title: 'เซรั่มบำรุงผิวหน้าไฮยาลูรอน ผิวนุ่มชุ่มชื้น กระจ่างใส',
    price: 690.0,
    originalPrice: 1290.0,
    category: 'ความงาม',
    description:
      'เซรั่มสูตรเข้มข้นช่วยฟื้นฟูผิวแห้งกร้าน รูขุมขนกระชับ อ่อนโยนต่อทุกสภาพผิว ไม่มีส่วนผสมของแอลกอฮอล์และพาราเบน',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    stock: 22,
    rating: 4.9,
    salesCount: 189,
    isFeatured: true
  },
  {
    productId: 8,
    title: 'กาแฟสกัดเย็น ออร์แกนิก หอมเข้มข้น ดื่มสดชื่น',
    price: 280.0,
    originalPrice: 450.0,
    category: 'อาหารและเครื่องดื่ม',
    description:
      'กาแฟ Cold Brew สกัดเย็นจากเมล็ดอาราบิก้าแท้ 100% ให้รสชาตินุ่มลึก ไร้ความกรดกัดกระเพาะ บรรจุขวดทรงเก๋พร้อมดื่ม',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80',
    stock: 35,
    rating: 4.8,
    salesCount: 150,
    isFeatured: false
  }
]

export const categories = [
  'ทั้งหมด',
  'อิเล็กทรอนิกส์',
  'แฟชั่น',
  'ของใช้ในบ้าน',
  'ความงาม',
  'อาหารและเครื่องดื่ม'
]
