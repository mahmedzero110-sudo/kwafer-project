const db = require('./db');

async function updateSchema() {
    try {
        console.log('جاري تحديث قاعدة البيانات...');
        const query = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255), 
            ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
        `;
        await db.query(query);
        console.log('✅ تم تحديث قاعدة البيانات بنجاح: تم إضافة أعمدة استعادة كلمة السر.');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ أثناء تحديث قاعدة البيانات:', error);
        process.exit(1);
    }
}

updateSchema();
