const db = require('./db');

async function createSettingsTables() {
    try {
        console.log('جاري إنشاء جداول الصفحات والإعدادات...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS site_settings (
                key VARCHAR(50) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS pages (
                slug VARCHAR(50) PRIMARY KEY,
                title_ar VARCHAR(255) NOT NULL,
                title_en VARCHAR(255),
                content_ar TEXT,
                content_en TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default social links
        const socialLinks = [
            ['facebook_url', '#'],
            ['instagram_url', '#'],
            ['twitter_url', '#'],
            ['whatsapp_number', '0123456789'],
            ['contact_email', 'info@kwafer.com']
        ];

        for (const [key, val] of socialLinks) {
            await db.query('INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, val]);
        }

        // Insert default pages
        const pages = [
            ['about', 'عن التطبيق', 'About Us', 'محتوى عن التطبيق سيتم كتابته هنا...', 'About content...'],
            ['how-it-works', 'كيفية الحجز', 'How it Works', 'طريقة الحجز سهلة جداً...', 'How to book content...'],
            ['partners', 'انضم كشريك', 'Join as Partner', 'سجلي صالونك معنا الآن...', 'Join as partner content...'],
            ['faq', 'الأسئلة الشائعة', 'FAQ', 'أجوبة على أسئلتك المتكررة...', 'FAQ content...'],
            ['privacy', 'سياسة الخصوصية', 'Privacy Policy', 'نحن نحمي بياناتك...', 'Privacy content...'],
            ['contact', 'اتصل بنا', 'Contact Us', 'نحن هنا لخدمتك...', 'Contact content...']
        ];

        for (const [slug, t_ar, t_en, c_ar, c_en] of pages) {
            await db.query(`
                INSERT INTO pages (slug, title_ar, title_en, content_ar, content_en) 
                VALUES ($1, $2, $3, $4, $5) 
                ON CONFLICT (slug) DO NOTHING
            `, [slug, t_ar, t_en, c_ar, c_en]);
        }

        console.log('✅ تم إنشاء الجداول والبيانات الافتراضية بنجاح.');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ في قاعدة البيانات:', error);
        process.exit(1);
    }
}

createSettingsTables();
