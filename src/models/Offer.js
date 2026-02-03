const db = require('../database/db');

class Offer {
    static async getAllActive() {
        const query = `
            SELECT o.*, s.name as salon_name, s.image_url as image
            FROM offers o
            JOIN salons s ON o.salon_id = s.id
            WHERE o.is_active = TRUE AND o.valid_until >= CURRENT_DATE
            ORDER BY o.created_at DESC
        `;
        const { rows } = await db.query(query);
        return rows;
    }

    static async getBySalonId(salonId) {
        const query = 'SELECT * FROM offers WHERE salon_id = $1 AND is_active = TRUE ORDER BY created_at DESC';
        const { rows } = await db.query(query, [salonId]);
        return rows;
    }

    static async getActiveByOwner(ownerId) {
        const query = `
            SELECT o.* 
            FROM offers o
            JOIN salons s ON o.salon_id = s.id
            WHERE s.owner_id = $1 AND o.is_active = TRUE AND o.valid_until >= CURRENT_DATE
            ORDER BY o.created_at DESC
        `;
        const { rows } = await db.query(query, [ownerId]);
        return rows;
    }

    static async getExpiredByOwner(ownerId) {
        const query = `
            SELECT o.* 
            FROM offers o
            JOIN salons s ON o.salon_id = s.id
            WHERE s.owner_id = $1 AND (o.is_active = FALSE OR o.valid_until < CURRENT_DATE)
            ORDER BY o.valid_until DESC
        `;
        const { rows } = await db.query(query, [ownerId]);
        return rows;
    }

    static async create(offerData) {
        const { salon_id, title, description, discount, price, valid_until } = offerData;
        const query = `
            INSERT INTO offers (salon_id, title, description, discount, price, valid_until)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const { rows } = await db.query(query, [salon_id, title, description, discount, price, valid_until]);
        return rows[0];
    }

    static async delete(id) {
        const query = 'UPDATE offers SET is_active = FALSE WHERE id = $1 RETURNING *';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = Offer;
