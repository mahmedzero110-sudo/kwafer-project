const db = require('../database/db');

class Review {
    static async getBySalonId(salonId) {
        const query = `
            SELECT r.*, u.name as customer_name
            FROM reviews r
            JOIN users u ON r.customer_id = u.id
            WHERE r.salon_id = $1 AND r.status = 'approved'
            ORDER BY r.created_at DESC
        `;
        const { rows } = await db.query(query, [salonId]);
        return rows;
    }

    static async getByOwner(ownerId, filters = {}) {
        let query = `
            SELECT r.*, u.name as customer_name, s.name as service_name
            FROM reviews r
            JOIN salons sa ON r.salon_id = sa.id
            JOIN users u ON r.customer_id = u.id
            LEFT JOIN services s ON r.service_id = s.id
            WHERE sa.owner_id = $1
        `;
        const params = [ownerId];
        let paramIndex = 2;

        if (filters.rating) {
            query += ` AND r.rating = $${paramIndex++}`;
            params.push(filters.rating);
        }

        if (filters.status) {
            query += ` AND r.status = $${paramIndex++}`;
            params.push(filters.status);
        }

        query += ` ORDER BY r.created_at DESC`;

        const { rows } = await db.query(query, params);
        return rows;
    }

    static async create({ customer_id, salon_id, service_id, rating, comment }) {
        const query = `
            INSERT INTO reviews (customer_id, salon_id, service_id, rating, comment, status)
            VALUES ($1, $2, $3, $4, $5, 'approved')
            RETURNING *
        `;
        const { rows } = await db.query(query, [customer_id, salon_id, service_id, rating, comment]);
        return rows[0];
    }

    static async delete(id, ownerId) {
        // Ensure the review belongs to the owner's salon
        const query = `
            DELETE FROM reviews 
            WHERE id = $1 AND salon_id IN (SELECT id FROM salons WHERE owner_id = $2)
            RETURNING *
        `;
        const { rows } = await db.query(query, [id, ownerId]);
        return rows[0];
    }

    static async updateReply(id, ownerId, reply) {
        const query = `
            UPDATE reviews 
            SET owner_reply = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND salon_id IN (SELECT id FROM salons WHERE owner_id = $3)
            RETURNING *
        `;
        const { rows } = await db.query(query, [reply, id, ownerId]);
        return rows[0];
    }

    static async updateStatus(id, ownerId, status) {
        const query = `
            UPDATE reviews 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND salon_id IN (SELECT id FROM salons WHERE owner_id = $3)
            RETURNING *
        `;
        const { rows } = await db.query(query, [status, id, ownerId]);
        return rows[0];
    }

    static async getStatsForOwner(ownerId) {
        const query = `
            SELECT 
                AVG(r.rating) as avg_rating,
                COUNT(r.id) as total_reviews,
                COUNT(CASE WHEN r.rating >= 4 THEN 1 END) as positive_reviews
            FROM reviews r
            JOIN salons s ON r.salon_id = s.id
            WHERE s.owner_id = $1
        `;
        const { rows } = await db.query(query, [ownerId]);
        return rows[0];
    }
}

module.exports = Review;
