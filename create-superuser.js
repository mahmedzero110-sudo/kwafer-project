const User = require('./src/models/User');
const db = require('./src/database/db');
const path = require('path');
require('dotenv').config();

async function createSuperUser() {
    const email = 'medo12@gmail.com';
    const password = '0108962272@Medo';
    const name = 'Medo';
    const role = 'admin';

    try {
        console.log('جاري التأكد من قاعدة البيانات...');
        const existing = await User.findByEmail(email);

        if (existing) {
            console.log('المستخدم موجود بالفعل، يتم تحديث الصلاحيات وكلمة السر...');
            await User.updatePassword(existing.id, password);
            await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, existing.id]);
        } else {
            console.log('يتم إنشاء حساب مدير الموقع الجديد...');
            await User.create({
                name,
                email,
                password,
                phone: '0108962272',
                role
            });
        }

        console.log('✅ تم إعداد حساب المدير بنجاح:');
        console.log(`- البريد: ${email}`);
        console.log(`- الرتبة: ${role}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ حدث خطأ أثناء إعداد الحساب:', error);
        process.exit(1);
    }
}

createSuperUser();
