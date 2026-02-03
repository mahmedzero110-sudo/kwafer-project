const db = require('./src/database/db');

async function fixDatabase() {
    try {
        console.log('--- تحديث هيكل قاعدة البيانات ---');

        // Add recovery_key column if not exists
        await db.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_key VARCHAR(255);
        `);
        console.log('✅ تم إضافة عمود مفتاح الاستعادة.');

        // Add unique constraint to email if not exists
        try {
            await db.query(`ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);`);
            console.log('✅ تم إضافة قيد الفرادة للبريد الإلكتروني.');
        } catch (e) {
            console.log('ℹ️ قيد الفرادة للبريد الإلكتروني موجود بالفعل.');
        }

        // Add unique constraint to phone if not exists
        try {
            await db.query(`ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);`);
            console.log('✅ تم إضافة قيد الفرادة لرقم الهاتف.');
        } catch (e) {
            console.log('ℹ️ قيد الفرادة لرقم الهاتف موجود بالفعل.');
        }

        console.log('--- انتهى التحديث بنجاح ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ في التحديث:', error);
        process.exit(1);
    }
}

fixDatabase();
