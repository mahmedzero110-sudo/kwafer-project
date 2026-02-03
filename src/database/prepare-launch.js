const db = require('./db');
const bcrypt = require('bcrypt');

async function prepareLaunch() {
    try {
        console.log('--- بدء عملية تجهيز الموقع للنشر ---');

        // 1. تنظيف جميع البيانات التشغيلية
        console.log('1. تنظيف قاعدة البيانات...');
        const cleanupQueries = [
            'TRUNCATE TABLE salon_gallery CASCADE',
            'TRUNCATE TABLE notifications CASCADE',
            'TRUNCATE TABLE reviews CASCADE',
            'TRUNCATE TABLE bookings CASCADE',
            'TRUNCATE TABLE offers CASCADE',
            'TRUNCATE TABLE services CASCADE',
            'TRUNCATE TABLE salons CASCADE',
            'DELETE FROM users' // Delete all users to replace them
        ];

        for (const query of cleanupQueries) {
            await db.query(query);
        }
        console.log('✅ تم تنظيف جميع الجداول بنجاح.');

        // 2. إضافة حساب صاحب الموقع (الأدمن)
        console.log('2. إنشاء حساب المدير الجديد...');
        const adminEmail = 'medo12@gmail.com';
        const adminPassword = '0108962272@MedoAhmed';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const insertAdminQuery = `
            INSERT INTO users (name, email, password, phone, role, is_phone_verified)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await db.query(insertAdminQuery, [
            'أحمد - إدارة كوافير',
            adminEmail,
            hashedPassword,
            '0108962272',
            'admin',
            true
        ]);

        console.log('✅ تم إنشاء حساب المدير بنجاح.');
        console.log('--- انتهت العملية بنجاح! الموقع جاهز للنشر الآن ---');
        console.log('البريد: ' + adminEmail);
        console.log('كلمة السر: ' + adminPassword);

        process.exit(0);
    } catch (error) {
        console.error('❌ حدث خطأ أثناء التجهيز:', error);
        process.exit(1);
    }
}

prepareLaunch();
