const db = require('../database/db');

class Booking {
    static async create({ customer_id, salon_id, service_id, booking_date, booking_time, amount, notes }) {
        const query = `
            INSERT INTO bookings (customer_id, salon_id, service_id, booking_date, booking_time, amount, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [customer_id, salon_id, service_id, booking_date, booking_time, amount, notes];
        const { rows } = await db.query(query, values);
        return rows[0];
    }

    // Advanced filtering for owner dashboard
    static async getWithFilters(ownerId, filters = {}) {
        let query = `
            SELECT b.*, 
                   sa.name as salon_name, 
                   u.name as customer_name, 
                   u.phone as customer_phone,
                   COALESCE(srv.name, 'باقة العروس') as service_name,
                   srv.duration as service_duration
            FROM bookings b
            JOIN salons sa ON b.salon_id = sa.id
            JOIN users u ON b.customer_id = u.id
            LEFT JOIN services srv ON b.service_id = srv.id
            WHERE sa.owner_id = $1 AND b.visible_to_salon = TRUE
        `;

        const params = [ownerId];
        let paramCount = 1;

        if (filters.status && filters.status !== 'all') {
            paramCount++;
            query += ` AND b.status = $${paramCount}`;
            params.push(filters.status);
        }

        if (filters.dateFrom) {
            paramCount++;
            query += ` AND b.booking_date >= $${paramCount}`;
            params.push(filters.dateFrom);
        }

        if (filters.dateTo) {
            paramCount++;
            query += ` AND b.booking_date <= $${paramCount}`;
            params.push(filters.dateTo);
        }

        if (filters.search) {
            paramCount++;
            query += ` AND (u.name ILIKE $${paramCount} OR u.phone ILIKE $${paramCount} OR b.id::text LIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
        }

        query += ' ORDER BY b.booking_date DESC, b.booking_time DESC';

        const { rows } = await db.query(query, params);
        return rows;
    }

    static async getByOwnerSalon(ownerId) {
        return this.getWithFilters(ownerId);
    }

    static async getByCustomerId(customerId) {
        const query = `
            SELECT b.*, sa.name as salon_name, COALESCE(s.name, 'باقة العروس') as service_name
            FROM bookings b
            JOIN salons sa ON b.salon_id = sa.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.customer_id = $1 AND b.visible_to_customer = TRUE
            ORDER BY b.booking_date DESC
        `;
        const { rows } = await db.query(query, [customerId]);
        return rows;
    }

    static async updateStatus(id, status) {
        const query = 'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
        const { rows } = await db.query(query, [status, id]);
        return rows[0];
    }

    static async getById(id) {
        const query = 'SELECT * FROM bookings WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async getStats(ownerId) {
        const query = `
            SELECT 
                COUNT(*) as total_bookings,
                SUM(amount) as total_revenue,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings
            FROM bookings b
            JOIN salons s ON b.salon_id = s.id
            WHERE s.owner_id = $1
        `;
        const { rows } = await db.query(query, [ownerId]);
        return rows[0];
    }

    static async softDelete(id, role) {
        let column = 'visible_to_admin';
        if (role === 'customer') column = 'visible_to_customer';
        else if (role === 'owner') column = 'visible_to_salon';

        const query = `UPDATE bookings SET ${column} = FALSE WHERE id = $1 RETURNING *`;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async deleteByCustomer(customerId) {
        const query = "UPDATE bookings SET visible_to_customer = FALSE WHERE customer_id = $1 AND (status = 'completed' OR status = 'cancelled')";
        await db.query(query, [customerId]);
    }

    static async deleteBySalon(salonId) {
        const query = "UPDATE bookings SET visible_to_salon = FALSE WHERE salon_id = $1 AND (status = 'completed' OR status = 'cancelled')";
        await db.query(query, [salonId]);
    }

    static async deleteAll() {
        const query = 'UPDATE bookings SET visible_to_admin = FALSE';
        await db.query(query);
    }
}

module.exports = Booking;
