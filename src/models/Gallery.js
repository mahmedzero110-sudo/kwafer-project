const db = require('../database/db');

class Gallery {
    static async getBySalonId(salonId) {
        const query = 'SELECT * FROM salon_gallery WHERE salon_id = $1 ORDER BY created_at DESC';
        const { rows } = await db.query(query, [salonId]);
        return rows;
    }

    static async addImage({ salon_id, image_url, caption = null }) {
        const query = `
            INSERT INTO salon_gallery (salon_id, image_url, caption)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const { rows } = await db.query(query, [salon_id, image_url, caption]);
        return rows[0];
    }

    static async delete(id, salon_id) {
        const query = 'DELETE FROM salon_gallery WHERE id = $1 AND salon_id = $2';
        await db.query(query, [id, salon_id]);
    }
}

module.exports = Gallery;
