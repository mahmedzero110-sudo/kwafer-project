const db = require('./src/database/db');

const seedSettings = async () => {
    try {
        const queries = [
            ['subs_title', 'طوري عملكِ مع كوافير'],
            ['subs_desc', 'سجلي صالونكِ وادرجي خدماتكِ أمام آلاف العميلات.'],
            ['subs_month_price', '150'],
            ['subs_3months_price', '400'],
            ['subs_6months_price', '750'],
            ['subs_year_price', '1400']
        ];

        for (const [key, value] of queries) {
            await db.query(`
                INSERT INTO site_settings (key, value) 
                VALUES ($1, $2) 
                ON CONFLICT (key) DO UPDATE SET value = $2
            `, [key, value]);
        }

        console.log('✅ Subscription settings seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding settings:', error);
        process.exit(1);
    }
};

seedSettings();
