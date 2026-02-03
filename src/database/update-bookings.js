const db = require('./db');

async function updateSchema() {
    try {
        console.log('جاري تحديث قاعدة البيانات...');

        // إضافة عمود سياسة الحجز
        await db.query(`
            ALTER TABLE salons 
            ADD COLUMN IF NOT EXISTS booking_policy TEXT 
            DEFAULT 'نرجو الالتزام بالموعد المحدد. في حالة التأخير لأكثر من 15 دقيقة، يحق للصالون إلغاء الحجز.';
        `);

        console.log('✅ تم إضافة عمود booking_policy بنجاح.');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ في التحديث:', error);
        process.exit(1);
    }
}

updateSchema();
