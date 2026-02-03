const db = require('../database/db');

class SubscriptionRequest {
    static async create({ user_id, plan_type }) {
        const query = `
            INSERT INTO subscription_requests (user_id, plan_type)
            VALUES ($1, $2)
            RETURNING *
        `;
        const { rows } = await db.query(query, [user_id, plan_type]);
        return rows[0];
    }

    static async getAllPending() {
        const query = `
            SELECT sr.*, u.name as owner_name, u.email as owner_email, s.name as salon_name, s.id as salon_id
            FROM subscription_requests sr
            JOIN users u ON sr.user_id = u.id
            LEFT JOIN salons s ON u.id = s.owner_id
            WHERE sr.status = 'pending'
            ORDER BY sr.created_at DESC
        `;
        const { rows } = await db.query(query);
        return rows;
    }

    static async updateStatus(id, status) {
        const query = `
            UPDATE subscription_requests 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *
        `;
        const { rows } = await db.query(query, [status, id]);
        return rows[0];
    }

    static async getById(id) {
        const query = 'SELECT * FROM subscription_requests WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = SubscriptionRequest;
