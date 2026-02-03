const db = require('./src/database/db');

async function cleanReviews() {
    try {
        console.log('جاري حذف التقييمات القديمة...');
        await db.query('DELETE FROM reviews');

        // Also fix the default status constraint if possible, but the code fix covers it
        await db.query("ALTER TABLE reviews ALTER COLUMN status SET DEFAULT 'approved'");

        console.log('✅ تم تنظيف سجل التقييمات وتحديث الإعدادات بنجاح!');
        process.exit(0);
    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        process.exit(1);
    }
}

cleanReviews();
