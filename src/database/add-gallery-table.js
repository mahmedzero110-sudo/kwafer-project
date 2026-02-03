const db = require('./db');

async function addGalleryTable() {
    try {
        console.log('جاري إضافة جدول معرض الصور...');
        const query = `
            CREATE TABLE IF NOT EXISTS salon_gallery (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                caption VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.query(query);
        console.log('✅ تم إضافة جدول معرض الصور بنجاح.');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ أثناء إضافة جدول معرض الصور:', error);
        process.exit(1);
    }
}

addGalleryTable();
