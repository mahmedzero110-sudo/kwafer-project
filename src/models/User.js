const db = require('../database/db');
const bcrypt = require('bcrypt');

class User {
    static async create({ name, email, password, phone, role = 'customer', google_id = null }) {
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Generate a unique recovery key
        const recoveryKey = Math.random().toString(36).substring(2, 12).toUpperCase();

        // Set trial period for owners (7 days)
        const subscription_expires_at = role === 'owner' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
        const trial_used = role === 'owner';

        const query = `
            INSERT INTO users (name, email, password, phone, role, google_id, is_phone_verified, recovery_key, subscription_expires_at, trial_used)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, name, email, phone, role, created_at, is_phone_verified, recovery_key, subscription_expires_at
        `;
        const values = [name, email, hashedPassword, phone, role, google_id, true, recoveryKey, subscription_expires_at, trial_used];
        const { rows } = await db.query(query, values);
        return rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const { rows } = await db.query(query, [email]);
        return rows[0];
    }

    static async findById(id) {
        const query = 'SELECT id, name, email, phone, role, created_at, google_id, is_phone_verified, avatar, subscription_expires_at, trial_used FROM users WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async findByGoogleId(googleId) {
        const query = 'SELECT * FROM users WHERE google_id = $1';
        const { rows } = await db.query(query, [googleId]);
        return rows[0];
    }

    static async findByPhone(phone) {
        const query = 'SELECT * FROM users WHERE phone = $1';
        const { rows } = await db.query(query, [phone]);
        return rows[0];
    }

    static async setPhoneVerificationCode(userId, code, expires) {
        const query = 'UPDATE users SET phone_verification_code = $1, phone_verification_expires = $2 WHERE id = $3';
        await db.query(query, [code, expires, userId]);
    }

    static async verifyPhone(userId) {
        const query = 'UPDATE users SET is_phone_verified = TRUE, phone_verification_code = NULL, phone_verification_expires = NULL WHERE id = $1';
        await db.query(query, [userId]);
    }

    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async getAllCustomers() {
        const query = 'SELECT id, name, email, phone, created_at FROM users WHERE role = $1 ORDER BY created_at DESC';
        const { rows } = await db.query(query, ['customer']);
        return rows;
    }

    static async setResetToken(email, token, expires) {
        const query = 'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3';
        await db.query(query, [token, expires, email]);
    }

    static async findByResetToken(token) {
        const query = 'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()';
        const { rows } = await db.query(query, [token]);
        return rows[0];
    }

    static async findByRecoveryKey(phone, recoveryKey) {
        const query = 'SELECT * FROM users WHERE phone = $1 AND recovery_key = $2';
        const { rows } = await db.query(query, [phone, recoveryKey]);
        return rows[0];
    }

    static async updatePassword(id, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2';
        await db.query(query, [hashedPassword, id]);
    }

    static async updateAvatar(id, avatar) {
        const query = 'UPDATE users SET avatar = $1 WHERE id = $2';
        await db.query(query, [avatar, id]);
    }

    static async updateSubscription(id, expiresAt) {
        const query = 'UPDATE users SET subscription_expires_at = $1 WHERE id = $2';
        await db.query(query, [expiresAt, id]);
    }

    static async addSubscriptionDays(id, days) {
        const query = 'UPDATE users SET subscription_expires_at = COALESCE(subscription_expires_at, NOW()) + ($1 || \' days\')::INTERVAL WHERE id = $2';
        await db.query(query, [days, id]);
    }

    static async getAllOwners() {
        const query = `
            SELECT u.*, s.name as salon_name, s.id as salon_id
            FROM users u 
            LEFT JOIN salons s ON u.id = s.owner_id 
            WHERE u.role = 'owner' 
            ORDER BY u.created_at DESC
        `;
        const { rows } = await db.query(query);
        return rows;
    }

    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1';
        await db.query(query, [id]);
    }
}

module.exports = User;
