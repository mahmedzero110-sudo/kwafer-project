const db = require('../database/db');

class Notification {
    static async create({ user_id, title, message, type = 'info' }) {
        const query = `
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const { rows } = await db.query(query, [user_id, title, message, type]);
        return rows[0];
    }

    static async getByUser(userId) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const { rows } = await db.query(query, [userId]);
        return rows;
    }

    static async getUnreadCount(userId) {
        const query = `
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = $1 AND is_read = FALSE
        `;
        const { rows } = await db.query(query, [userId]);
        return parseInt(rows[0].count);
    }

    static async markAsRead(id, userId) {
        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        const { rows } = await db.query(query, [id, userId]);
        return rows[0];
    }

    static async markAllAsRead(userId) {
        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE user_id = $1
        `;
        await db.query(query, [userId]);
    }

    static async delete(id, userId) {
        const query = `
            DELETE FROM notifications 
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        const { rows } = await db.query(query, [id, userId]);
        return rows[0];
    }
}

module.exports = Notification;
