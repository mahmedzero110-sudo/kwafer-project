const db = require('../database/db');

class Settings {
    static async getAll() {
        const { rows } = await db.query('SELECT * FROM site_settings');
        return rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
    }

    static async update(key, value) {
        await db.query('UPDATE site_settings SET value = $1, updated_at = NOW() WHERE key = $2', [value, key]);
    }

    static async getPage(slug) {
        const { rows } = await db.query('SELECT * FROM pages WHERE slug = $1', [slug]);
        return rows[0];
    }

    static async getAllPages() {
        const { rows } = await db.query('SELECT * FROM pages ORDER BY title_ar ASC');
        return rows;
    }

    static async updatePage(slug, data) {
        const { title_ar, title_en, content_ar, content_en } = data;
        await db.query(`
            UPDATE pages 
            SET title_ar = $1, title_en = $2, content_ar = $3, content_en = $4, updated_at = NOW() 
            WHERE slug = $5
        `, [title_ar, title_en, content_ar, content_en, slug]);
    }
}

module.exports = Settings;
