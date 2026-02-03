const db = require('./src/database/db');

const seedHeroSetting = async () => {
    try {
        await db.query(`
            INSERT INTO site_settings (key, value) 
            VALUES ($1, $2) 
            ON CONFLICT (key) DO NOTHING
        `, ['hero_image_url', '/images/hero-display.png']);

        console.log('✅ Hero image setting seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding hero setting:', error);
        process.exit(1);
    }
};

seedHeroSetting();
